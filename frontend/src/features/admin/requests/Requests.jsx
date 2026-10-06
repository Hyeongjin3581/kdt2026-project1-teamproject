import { useEffect, useState } from "react";
import { toServerTime } from "../../../utils/timeFormat";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { useCenter, inCenter } from "../../../context/CenterContext";
import LoadStatus from "../../../components/common/LoadStatus";
import { buildAdminModel, emptyModel, emptyRaw } from "../../../utils/adminAdapters";

// 요청 상태별 탭 : 신청(미배정) → 배정중(요양보호사 수락 대기) → 배정완료(수락)
const tabs = [
  { id: "all", label: "전체" },
  { id: "unassigned", label: "신청 (미배정)" },
  { id: "pending", label: "배정중 (수락 대기)" },
  { id: "assigned", label: "배정완료" },
];

export default function Requests() {
  const center = useCenter();
  const [model, setModel] = useState(emptyModel);
  const [status, setStatus] = useState("loading");
  const [tab, setTab] = useState("all");

  // 요청 관리 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    setStatus("loading");
    try {
      const [centersRes, careworkersRes, guardiansRes, recipientsRes] = await Promise.all([
        axios.get("http://localhost:8080/center", { withCredentials: true }),
        axios.get("http://localhost:8080/api/careworkers", { withCredentials: true }),
        axios.get("http://localhost:8080/guardian", { withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }),
      ]);
      // 수급자별 방문 요청, 센터별 근무기록
      const [requestLists, reportLists] = await Promise.all([
        Promise.all(recipientsRes.data.map((r) =>
          axios.get("http://localhost:8080/request/carerecipient", { params: { carerecipient_no: r.careRecipientNo }, withCredentials: true }).catch(() => ({ data: [] }))
        )),
        Promise.all(centersRes.data.map((c) => c.centerNo).map((no) =>
          axios.get("http://localhost:8080/careworkerreport/center", { params: { center_no: no }, withCredentials: true }).catch(() => ({ data: [] }))
        )),
      ]);
      setModel(buildAdminModel({
        ...emptyRaw,
        centers: centersRes.data, careworkers: careworkersRes.data, guardians: guardiansRes.data, recipients: recipientsRes.data,
        requests: requestLists.flatMap((res) => res.data),
        reports: reportLists.flatMap((res) => res.data),
      }));
      setStatus("ok");
    } catch (error) {
      console.error("요청 관리 조회 실패:", error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, []);

  // 자동배정(후보 추천) : GET /careworkerreport/candidates?request_no=번호 → 상위 3명 [{ careworkerNo, careworkerName, distanceKm, workCount, distanceScore, workScore, totalScore }]
  // 이 API 가 아직 없으면 전체 요양보호사 목록에서 직접 고르게 한다.
  const [assignTarget, setAssignTarget] = useState(null);
  const [candidates, setCandidates] = useState({ loading: false, list: [], noApi: false });
  const [manual, setManual] = useState(false);
  const [pickedCw, setPickedCw] = useState("");
  const openAssign = async (a) => {
    setAssignTarget(a);
    setPickedCw(String(a.careworkerNo ?? ""));
    setManual(false);
    setCandidates({ loading: true, list: [], noApi: false });
    try {
      const response = await axios.get("http://localhost:8080/careworkerreport/candidates", { params: { request_no: a.requestNo }, withCredentials: true });
      setCandidates({ loading: false, list: Array.isArray(response.data) ? response.data.slice(0, 3) : [], noApi: false });
    } catch (error) {
      setCandidates({ loading: false, list: [], noApi: true });
    }
  };

  // 지정(배정) : 기존 근무기록이 있으면 삭제(DELETE) 후 새 근무기록 등록(POST /careworkerreport, 상태 '배정') + 요청 '배정중'
  const assign = async () => {
    const a = assignTarget;
    if (!pickedCw) { alert("요양보호사를 선택해주세요."); return; }
    try {
      if (a.reportNo) await axios.delete("http://localhost:8080/careworkerreport", { params: { careworker_report_no: a.reportNo }, withCredentials: true });
      const response = await axios.post(
        "http://localhost:8080/careworkerreport",
        { careworkerNo: Number(pickedCw), requestNo: a.requestNo, workDate: a.iso, workStartTime: toServerTime(a.start), workEndTime: toServerTime(a.end), workStatus: "배정" },
        { withCredentials: true }
      );
      // 요양보호사의 수락을 기다리는 상태 : PUT /request?request_no=번호 (body 에 { requestState })
      if (response.data) await axios.put("http://localhost:8080/request", { requestState: "배정중" }, { params: { request_no: a.requestNo }, withCredentials: true });
      if (response.data) { setAssignTarget(null); loadData(); }
      else alert("담당자 지정에 실패했습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  // 배정 제외 : 근무기록 삭제 (DELETE /careworkerreport?careworker_report_no=번호) + 요청 '신청'으로 복귀
  const exclude = async (a) => {
    if (!a.reportNo) return;
    if (!window.confirm(`${a.recipient} 수급자의 ${a.date} 배정을 제외할까요?`)) return;
    try {
      const response = await axios.delete("http://localhost:8080/careworkerreport", { params: { careworker_report_no: a.reportNo }, withCredentials: true });
      if (response.data) await axios.put("http://localhost:8080/request", { requestState: "신청" }, { params: { request_no: a.requestNo }, withCredentials: true });
      if (response.data) loadData();
      else alert("배정 제외에 실패했습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  // 확정 처리 : 요양보호사가 수락하면 근무기록 '확정' + 요청 '배정완료' (요양보호사 페이지가 생기기 전에는 관리자가 대신 처리)
  const confirmAssign = async (a) => {
    if (!a.reportNo) return;
    try {
      const response = await axios.put("http://localhost:8080/careworkerreport", null, { params: { careworker_report_no: a.reportNo, work_status: "확정" }, withCredentials: true });
      if (response.data) await axios.put("http://localhost:8080/request", { requestState: "배정완료" }, { params: { request_no: a.requestNo }, withCredentials: true });
      if (response.data) loadData();
      else alert("확정 처리에 실패했습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  const { centers, assignments, stateMeta } = model;
  // 요청 관리는 진행 중인 요청(신청·배정중·배정완료)만 다룬다. 방문이 끝난 요청은 방문 일정에서 확인
  const all = assignments.filter(inCenter(center)).filter((a) => a.requestState !== "완료");
  const count = (s) => all.filter((a) => a.state === s).length;
  const list = tab === "all" ? all : all.filter((a) => a.state === tab);

  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} />;
  return (
    <div className="space-y-5">
      <SectionTitle title="요청 관리" subtitle="보호자가 신청한 방문 요청을 확인하고 요양보호사를 배정합니다. 요청 옆의 자동배정을 누르면 조건에 맞는 후보를 추천받아 지정할 수 있습니다." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[["전체 요청", all.length, "info"], ["신청 (미배정)", count("unassigned"), "danger"], ["배정중 (수락 대기)", count("pending"), "warning"], ["배정완료", count("assigned"), "ok"]].map(([l, v, t]) => (
          <Panel key={l} className="p-4"><Badge tone={t}>{l.split(" ")[0]}</Badge><div className="mt-3 flex items-end gap-1"><b className="font-display text-3xl text-slate-900">{v}</b><span className="mb-1 text-sm text-slate-500">건</span></div><p className="mt-1 text-xs font-medium text-slate-600">{l}</p></Panel>
        ))}
      </div>
      <Panel className="flex items-center gap-2 border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-800">
        <span className="text-teal-500">✓</span> 자동배정은 근무중인 요양보호사 중 선호 성별, 근무 가능 시간, 기존 일정과의 시간 충돌을 통과한 후보에게 거리 점수를 매겨 상위 3명을 보여 줍니다. 관리자가 한 명을 지정하면 요양보호사에게 수락 여부를 묻습니다.
      </Panel>
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${tab === t.id ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t.label} <span className="font-mono">{t.id === "all" ? all.length : count(t.id)}</span>
            </button>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {list.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">해당하는 요청이 없습니다.</p>}
          {list.map((a) => {
            const sm = stateMeta[a.state];
            return (
              <div key={a.requestNo} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center">
                <div className="lg:w-52">
                  <b className="text-sm text-slate-800">{a.recipient} <span className="font-normal text-slate-400">수급자</span></b>
                  <p className="mt-1 font-mono text-xs text-slate-500">{a.date} · {a.time}</p>
                  {center === "all" && <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{centers.find((c) => c.id === a.center)?.short}</span>}
                </div>
                <div className="lg:w-40">
                  {a.cg === "미배정" ? <b className="text-sm font-bold text-red-600">미배정</b> : (
                    <div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{a.cg[0]}</div><div><b className="text-sm text-slate-800">{a.cg}</b></div></div>
                  )}
                </div>
                <div className="flex-1"><div className="flex flex-wrap gap-1.5">{a.reasons.map((r) => <span key={r} className={`rounded-md px-2 py-1 text-[11px] ${a.state === "unassigned" ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"}`}>{r}</span>)}</div></div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge tone={sm.tone}>{sm.label}</Badge>
                  {a.state === "unassigned" && <button onClick={() => openAssign(a)} className="rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-700">자동배정</button>}
                  {a.state === "pending" && <button onClick={() => confirmAssign(a)} className="rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-teal-700">확정 처리</button>}
                  {a.state !== "unassigned" && <button onClick={() => openAssign(a)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">담당자 변경</button>}
                  {a.state !== "unassigned" && <button onClick={() => exclude(a)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">배정 제외</button>}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setAssignTarget(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-6 py-4"><h2 className="font-display text-lg font-bold text-slate-900">{assignTarget.reportNo ? "담당자 변경" : "자동배정 · 후보 추천"}</h2><p className="mt-1 text-xs text-slate-400">{assignTarget.recipient} 수급자 · {assignTarget.date} {assignTarget.time}</p></div>
            <div className="space-y-3 px-6 py-5">
              {candidates.loading && <p className="text-sm text-slate-500">조건에 맞는 후보를 찾는 중입니다...</p>}
              {!candidates.loading && candidates.list.length > 0 && !manual && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">추천 후보 상위 {candidates.list.length}명 · 한 명을 선택하세요</p>
                  {candidates.list.map((c, i) => (
                    <button key={c.careworkerNo} onClick={() => setPickedCw(String(c.careworkerNo))} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${pickedCw === String(c.careworkerNo) ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{i + 1}</span>
                      <span className="flex-1">
                        <b className="text-sm text-slate-800">{c.careworkerName}</b>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {typeof c.distanceKm === "number" ? `거리 ${c.distanceKm.toFixed(1)}km` : ""}
                          {c.workCount !== undefined ? ` · 최근 30일 ${c.workCount}회` : ""}
                        </span>
                      </span>
                      {c.totalScore !== undefined && <span className="text-right"><span className="block font-mono text-sm font-bold text-teal-600">{Number(c.totalScore).toFixed(1)}점</span><span className="block text-[10px] text-slate-400">거리 {Number(c.distanceScore ?? 0).toFixed(0)} + 근무 {Number(c.workScore ?? 0).toFixed(0)}</span></span>}
                    </button>
                  ))}
                </div>
              )}
              {!candidates.loading && candidates.list.length === 0 && !candidates.noApi && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">조건에 맞는 후보가 없습니다. 아래에서 요양보호사를 직접 선택할 수 있습니다.</p>}
              {!candidates.loading && candidates.noApi && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">후보 추천 기능(서버)이 아직 준비되지 않아 전체 요양보호사 중에서 직접 선택합니다.</p>}
              {!candidates.loading && (manual || candidates.list.length === 0) && (
                <label className="block text-xs font-semibold text-slate-600">요양보호사 직접 선택
                  <select value={pickedCw} onChange={(e) => setPickedCw(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                    <option value="">선택하세요</option>
                    {model.caregivers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.status} · 이번 주 {c.week}h</option>)}
                  </select>
                </label>
              )}
              {!candidates.loading && candidates.list.length > 0 && <button onClick={() => setManual((m) => !m)} className="text-xs font-semibold text-teal-600 hover:underline">{manual ? "← 추천 후보로 돌아가기" : "추천 후보 말고 직접 선택하기"}</button>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setAssignTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">취소</button>
              <button onClick={assign} disabled={!pickedCw} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">배정하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
