//
import { useEffect, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { dot } from "../../../components/common/dot";
import LoadStatus from "../../../components/common/LoadStatus";
import RecipientEditModal from "../../../components/common/RecipientEditModal";
import { TODAY } from "../../../constants";
import { buildVisits, thisWeek, todayIso } from "../../../utils/guardianAdapters";

export default function GuardianHome({ go, guardianName, onRecipientChanged, recipients, activeRecipientId, onSelectRecipient }) {
  const [editing, setEditing] = useState(false);
  const activeRecipient = recipients.find((recipient) => recipient.id === activeRecipientId) ?? recipients[0];
  const [visits, setVisits] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);

  // 방문 일정 : 수급자의 방문 요청 + 근무기록 + 요양보호사를 axios로 조회 (axios.get("통신할주소", { 옵션 }) → response.data)
  async function loadData() {
    if (!activeRecipient) { setStatus("ok"); return; }
    setStatus("loading");
    try {
      const [requestsRes, careworkersRes] = await Promise.all([
        axios.get("/request/carerecipient", { params: { careRecipientNo: activeRecipient.id }, withCredentials: true }),
        axios.get("/api/careworkers", { withCredentials: true }),
      ]);
      const reportLists = await Promise.all([...new Set(careworkersRes.data.map((c) => c.centerNo))].map((no) =>
        axios.get("/careworkerreport/center", { params: { centerNo: no }, withCredentials: true }).catch(() => ({ data: [] }))
      ));
      setVisits(buildVisits({ requests: requestsRes.data, reports: reportLists.flatMap((res) => res.data), careworkers: careworkersRes.data }));
      setStatus("ok");
    } catch (error) {
      console.error("방문 일정 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, [activeRecipient?.id]);

  const range = thisWeek();
  const week = visits.filter((v) => !v.cancelled && v.iso >= range.start && v.iso <= range.end);
  const todayVisit = visits.find((v) => !v.cancelled && v.iso === todayIso);
  const lastDone = [...visits].filter((v) => v.done).sort((a, b) => b.iso.localeCompare(a.iso))[0];
  const nextWithCg = week.find((v) => v.cg !== "배정 예정");
  const alerts = [
    ...(nextWithCg ? [["ok", `이번 주에는 ${nextWithCg.cg} 요양보호사가 방문합니다.`]] : []),
    ...(lastDone ? [["info", `${lastDone.date} 방문 기록이 등록되었습니다.`]] : []),
  ];
  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">안녕하세요, {guardianName} 보호자님</h1>
          <p className="mt-1 text-sm text-slate-500">{activeRecipient ? `${activeRecipient.name} 어르신의 방문요양 현황을 확인하세요.` : "돌봄 어르신을 등록하고 방문요양 상담을 시작하세요."}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => go("recipient")} className="rounded-lg border border-teal-200 bg-white px-4 py-2.5 text-sm font-bold text-teal-700 transition hover:bg-teal-50">＋ 수급자 추가</button>
          {activeRecipient && <button onClick={() => go("apply")} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">서비스 신청</button>}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_.85fr]">
        <div className="space-y-5">
          <Panel className="overflow-hidden">
            {activeRecipient ? <>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div><h2 className="font-display font-bold text-slate-900">돌봄 어르신</h2><p className="mt-0.5 text-xs text-slate-400">등록된 어르신을 선택해 현황을 확인하세요.</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50">✎ 선택한 어르신 수정·삭제</button>
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">총 {recipients.length}명</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {recipients.map((recipient) => {
                  const isActive = recipient.id === activeRecipient.id;
                  return <button key={recipient.id} type="button" onClick={() => onSelectRecipient(recipient.id)} className={`flex w-full items-center gap-4 px-5 py-4 text-left transition ${isActive ? "bg-teal-50/60" : "hover:bg-slate-50"}`}>
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-lg font-bold ${isActive ? "bg-teal-500 text-white" : "bg-teal-100 text-teal-700"}`}>{recipient.name[0]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><h3 className="font-display text-base font-bold text-slate-900">{recipient.name} 어르신</h3>{isActive && <Badge tone="ok">선택됨</Badge>}</div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{recipient.address} · {recipient.age}세 · {recipient.gender === "female" ? "여성" : recipient.gender === "male" ? "남성" : "성별 미확인"}</p>
                    </div>
                    <span className="text-slate-300">›</span>
                  </button>;
                })}
              </div>
            </> : <div className="px-5 py-7 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-xl text-teal-600">＋</div>
              <h2 className="mt-3 font-display font-bold text-slate-900">등록된 돌봄 어르신이 없습니다</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">어르신을 등록하면 서비스 신청과 방문 일정 확인을 시작할 수 있습니다.</p>
              <button onClick={() => go("recipient")} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-700">수급자 등록하기</button>
            </div>}
          </Panel>

          {activeRecipient ? <><Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 className="font-display font-bold text-slate-900">이번 주 방문 일정</h2><p className="mt-0.5 text-xs text-slate-400">{range.label}</p></div>
              <button onClick={() => go("schedule")} className="text-xs font-semibold text-teal-600 hover:underline">전체 보기 →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>{["날짜", "방문 시간", "담당 요양보호사", "상태"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {week.map((v, i) => (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-semibold text-teal-700">{v.day}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-700">{v.t}</td>
                      <td className="px-5 py-3.5 text-slate-700">{v.caregiver}</td>
                      <td className="px-5 py-3.5"><Badge tone={v.tone}>{v.label}</Badge></td>
                    </tr>
                  ))}
                  {week.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">이번 주 방문 일정이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-display font-bold text-slate-900">오늘 예정 방문</h2>
              <p className="mt-0.5 text-xs text-slate-400">{TODAY}</p>
            </div>
            {todayVisit ? <div className="flex items-stretch">
              <div className="w-1.5 bg-teal-500 shrink-0" />
              <div className="flex flex-1 flex-wrap items-center justify-between gap-4 px-5 py-5">
                <div>
                  <Badge tone="info">오늘 예정</Badge>
                  <p className="mt-3 font-mono text-lg font-bold text-teal-700">{todayVisit.time}</p>
                  <p className="mt-1 font-display text-xl font-bold text-slate-900">{todayVisit.caregiver}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{todayVisit.note}</p>
                </div>
                <button onClick={() => go("request")} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">일정 변경 요청</button>
              </div>
            </div> : <p className="px-5 py-8 text-center text-sm text-slate-400">오늘 예정된 방문이 없습니다.</p>}
          </Panel>
          </> : <Panel className="border-dashed p-5">
            <h2 className="font-display font-bold text-slate-900">다음 단계</h2>
            <p className="mt-1 text-sm text-slate-500">수급자 등록을 완료한 뒤 서비스 신청을 진행해주세요.</p>
          </Panel>}
        </div>

        <div className="space-y-5">
          <Panel>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">알림</h2></div>
            <div className="space-y-1 p-3">
              {alerts.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-400">새 알림이 없습니다.</p>}
              {alerts.map(([t, msg], i) => (
                <div key={i} className="flex gap-3 rounded-lg p-3">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot(t)}`} />
                  <p className="text-xs leading-5 text-slate-600">{msg}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="font-display font-bold text-slate-900">빠른 이동</h2>
            <div className="mt-3 space-y-2">
              {[["apply", "서비스 신청", "방문요양·목욕·간호 신청"], ["schedule", "방문 일정 확인", "주간 방문 일정 보기"], ["records", "방문 기록 확인", "최근 방문 활동 내역"], ["request", "요청 · 문의", "센터에 변경 요청 전달"]].map(([id, label, sub]) => (
                <button key={id} onClick={() => go(id)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50">
                  <div><p className="text-sm font-bold text-slate-800">{label}</p><p className="text-[11px] text-slate-400">{sub}</p></div>
                  <span className="text-slate-300">›</span>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      {editing && activeRecipient && <RecipientEditModal recipient={activeRecipient.raw} onClose={() => setEditing(false)} onChanged={() => { setEditing(false); onRecipientChanged(); }} />}
    </div>
  );
}
