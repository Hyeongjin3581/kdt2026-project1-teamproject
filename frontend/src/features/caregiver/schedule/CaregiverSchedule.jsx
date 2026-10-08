import { useEffect, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import LoadStatus from "../../../components/common/LoadStatus";
import CaregiverPageTitle from "../CaregiverPageTitle";
import { buildVisits, visitStatusMeta } from "../../../utils/caregiverAdapters";

// 방문 시작 24시간 전부터는 요양보호사가 직접 취소할 수 없다 (센터에서 다른 요양보호사를 구할 시간이 필요하므로)
const CANCEL_LIMIT_MS = 24 * 60 * 60 * 1000;
// 방문 시작 시각(날짜 + 시작 시)까지 남은 시간(ms) : 근무기록의 시간은 '시' 단위 정수(예: 9)
const msUntilStart = (visit, now) => new Date(`${visit.iso}T${String(visit.start ?? 0).padStart(2, "0")}:00:00`).getTime() - now;

// 방문 일정 : 관리자가 지정한 배정(수락 대기)을 수락·거절하고, 확정된 방문은 완료 처리하거나 취소한다.
export default function CaregiverSchedule({ careworkerNo, onChanged }) {
  const [pending, setPending] = useState([]);   // 수락 대기 (근무기록 '배정')
  const [confirmed, setConfirmed] = useState([]); // 확정된 방문 (근무기록 '확정')
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [date, setDate] = useState("");
  const [busyNo, setBusyNo] = useState(null);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now()); // 취소 가능 여부(24시간 전)를 계속 맞추기 위해 1분마다 갱신
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);

  // 방문 일정 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    setLoadError(null);
    try {
      const [mineRes, recipientsRes] = await Promise.all([
        axios.get("http://localhost:8080/careworkerreport/careworker", { params: { careworkerNo: careworkerNo }, withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }),
      ]);
      // 수락 대기 배정 : GET /careworkerreport/findMyAssignments?carworkerNo=번호 (서버 파라미터 이름이 carworkerNo)
      const assignedRes = await axios.get("http://localhost:8080/careworkerreport/findMyAssignments", { params: { careworkerNo: careworkerNo }, withCredentials: true })
        .catch(() => ({ data: mineRes.data.filter((r) => r.workStatus === "배정") })); // API 가 아직 없는 서버면 내 근무기록에서 '배정'만 골라 쓴다
      // 근무기록에는 요청 번호만 있어서, 수급자별 요청을 받아 수급자 이름·주소를 연결한다
      const requestLists = await Promise.all(recipientsRes.data.map((r) =>
        axios.get("http://localhost:8080/request/carerecipient", { params: { careRecipientNo: r.careRecipientNo }, withCredentials: true }).catch(() => ({ data: [] }))
      ));
      const base = { requests: requestLists.flatMap((res) => res.data), recipients: recipientsRes.data };
      setPending(buildVisits({ ...base, reports: assignedRes.data }));
      // 확정된 방문 : GET /careworkerreport/findMyConfirmed?careworkerNo=번호
      const confirmedRes = await axios.get("http://localhost:8080/careworkerreport/findMyConfirmed", { params: { careworkerNo }, withCredentials: true })
        .catch(() => ({ data: mineRes.data.filter((r) => r.workStatus === "확정") })); // API 가 아직 없는 서버면 내 근무기록에서 '확정'만 골라 쓴다
      setConfirmed(buildVisits({ ...base, reports: confirmedRes.data }));
      setStatus("ok");
    } catch (error) {
      console.error("방문 일정 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, [careworkerNo]);

  // 수락 / 거절 : PUT /careworkerreport/accept | reject  (body { careworkersReportNo })
  // 수락 → 근무기록 '확정' + 요청 '배정완료',  거절 → 근무기록 '취소' + 요청 '신청'(관리자가 다시 배정)
  const answer = async (visit, action) => {
    if (busyNo) return;
    if (action === "reject" && !window.confirm(`${visit.date} ${visit.recipientName} 수급자 방문 배정을 거절할까요?`)) return;
    setBusyNo(visit.reportNo);
    setMessage("");
    try {
      const response = await axios.put(`http://localhost:8080/careworkerreport/${action}`, { careworkersReportNo: visit.reportNo }, { withCredentials: true });
      if (response.data) {
        setMessage(action === "accept" ? `${visit.date} ${visit.recipientName} 수급자 방문을 수락했습니다. 확정 일정에 추가되었습니다.` : `${visit.date} 배정을 거절했습니다. 센터에서 다른 요양보호사를 배정합니다.`);
        await loadData();
        onChanged?.(); // 사이드 메뉴의 수락 대기 표시도 바로 갱신
      } else {
        alert("처리하지 못했습니다. 이미 처리된 배정인지 확인해주세요.");
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setBusyNo(null);
    }
  };

  // 확정된 방문 완료 / 취소 : PUT /careworkerreport/complete | cancel  (body { careworkersReportNo })
  // 완료 → 근무기록 '완료' + 요청 '완료'(업무 기록으로 이동),  취소 → 근무기록 '취소' + 요청 '신청'(결원이 되어 관리자가 다시 배정)
  const finish = async (visit, action) => {
    if (busyNo) return;
    if (action === "cancel" && msUntilStart(visit, Date.now()) <= CANCEL_LIMIT_MS) {
      alert("방문 시작 24시간 전부터는 직접 취소할 수 없습니다. 급한 사정이면 소속 센터에 문의해주세요.");
      return;
    }
    const question = action === "complete"
      ? `${visit.date} ${visit.recipientName} 수급자 방문을 완료 처리할까요? 완료하면 업무 기록으로 옮겨집니다.`
      : `${visit.date} ${visit.recipientName} 수급자 방문을 취소할까요? 취소하면 센터에서 다른 요양보호사를 다시 배정합니다.`;
    if (!window.confirm(question)) return;
    setBusyNo(visit.reportNo);
    setMessage("");
    try {
      const response = await axios.put(`http://localhost:8080/careworkerreport/${action}`, { careworkersReportNo: visit.reportNo }, { withCredentials: true });
      if (response.data) {
        setMessage(action === "complete" ? `${visit.date} ${visit.recipientName} 수급자 방문을 완료했습니다. 업무 기록에서 확인할 수 있습니다.` : `${visit.date} ${visit.recipientName} 수급자 방문을 취소했습니다. 센터에서 다른 요양보호사를 배정합니다.`);
        await loadData();
        onChanged?.();
      } else {
        alert("처리하지 못했습니다. 이미 처리된 방문인지 확인해주세요.");
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setBusyNo(null);
    }
  };

  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  const filtered = confirmed.filter((v) => !date || v.iso === date);

  return (
    <div className="space-y-5">
      <CaregiverPageTitle title="방문 일정" subtitle="센터에서 지정한 방문을 수락하거나 거절하고, 확정된 방문은 끝나면 완료 처리하세요." />
      {message && <p role="status" className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p>}

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div><h2 className="font-display font-bold text-slate-900">수락 대기 중인 배정 <span className="ml-1 text-sm text-amber-600">{pending.length}건</span></h2><p className="mt-1 text-xs text-slate-500">수락하면 확정 일정이 되고, 거절하면 센터에서 다른 요양보호사를 배정합니다.</p></div>
          <button type="button" onClick={loadData} className="text-xs font-semibold text-teal-600 hover:underline">새로고침</button>
        </div>
        {pending.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-400">수락을 기다리는 배정이 없습니다.</p> : (
          <div className="divide-y divide-slate-100">
            {pending.map((v) => (
              <article key={v.reportNo} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2"><b className="text-sm text-slate-900">{v.date}</b><span className="font-mono text-xs text-teal-700">{v.time}</span><Badge tone="warning">수락 대기</Badge></div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-800">{v.recipientName} 수급자</p>
                  <p className="mt-0.5 break-words text-xs text-slate-500">{v.address}{v.content && ` · ${v.content}`}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => answer(v, "reject")} disabled={busyNo !== null} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">거절</button>
                  <button type="button" onClick={() => answer(v, "accept")} disabled={busyNo !== null} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50">{busyNo === v.reportNo ? "처리 중..." : "수락"}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div><h2 className="font-display font-bold text-slate-900">확정된 방문 일정</h2><p className="mt-1 text-xs text-slate-500">{date || "전체 날짜"} · {filtered.length}건</p></div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-slate-600">방문 날짜
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1.5 block rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
            </label>
            <button type="button" onClick={() => setDate("")} disabled={!date} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">초기화</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] whitespace-nowrap text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{["방문 날짜", "시간", "수급자", "방문 주소", "상태", ""].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead>
            <tbody>{filtered.map((v) => (
              <tr key={v.reportNo} className="border-t border-slate-100 hover:bg-slate-50/70">
                <td className="px-5 py-4 font-semibold text-slate-800">{v.date}</td>
                <td className="px-5 py-4 font-mono text-xs">{v.time}</td>
                <td className="px-5 py-4">{v.recipientName}</td>
                <td className="px-5 py-4 text-slate-600">{v.address}</td>
                <td className="px-5 py-4"><Badge tone={visitStatusMeta[v.status]?.tone}>{visitStatusMeta[v.status]?.label ?? v.status}</Badge></td>
                <td className="px-5 py-4 text-right">
                  <button type="button" onClick={() => finish(v, "cancel")} disabled={busyNo !== null || msUntilStart(v, now) <= CANCEL_LIMIT_MS} title={msUntilStart(v, now) <= CANCEL_LIMIT_MS ? "방문 시작 24시간 전부터는 취소할 수 없습니다. 센터에 문의해주세요." : "방문 취소"} className="mr-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">취소</button>
                  <button type="button" onClick={() => finish(v, "complete")} disabled={busyNo !== null} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50">{busyNo === v.reportNo ? "처리 중..." : "방문 완료"}</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-5 text-slate-500">방문 시작 24시간 전부터는 직접 취소할 수 없습니다. 급한 사정이면 소속 센터에 문의해주세요.</p>
        {filtered.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-400">{confirmed.length === 0 ? "확정된 방문 일정이 없습니다." : "선택한 날짜에 방문 일정이 없습니다."}</p>}
      </Panel>
    </div>
  );
}
