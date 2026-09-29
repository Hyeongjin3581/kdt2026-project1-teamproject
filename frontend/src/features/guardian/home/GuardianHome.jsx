import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { dot } from "../../../components/common/dot";
import { TODAY } from "../../../constants";

export default function GuardianHome({ go, recipients, activeRecipientId, onSelectRecipient }) {
  const activeRecipient = recipients.find((recipient) => recipient.id === activeRecipientId) ?? recipients[0];
  const week = [
    { day: "월 09.15", t: "09:00~12:00", cg: "박영희", tone: "ok", label: "방문 완료" },
    { day: "수 09.17", t: "09:00~12:00", cg: "박영희", tone: "info", label: "오늘 예정" },
    { day: "금 09.19", t: "09:00~12:00", cg: "박영희", tone: "neutral", label: "예정" },
  ];
  const alerts = [
    ["ok", "이번 주 담당자 변경 없이 박영희 요양보호사가 방문합니다."],
    ["info", "09월 15일 (월) 방문 기록이 등록되었습니다."],
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">안녕하세요, 이수현 보호자님</h1>
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
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">총 {recipients.length}명</span>
              </div>
              <div className="divide-y divide-slate-100">
                {recipients.map((recipient) => {
                  const isActive = recipient.id === activeRecipient.id;
                  return <button key={recipient.id} type="button" onClick={() => onSelectRecipient(recipient.id)} className={`flex w-full items-center gap-4 px-5 py-4 text-left transition ${isActive ? "bg-teal-50/60" : "hover:bg-slate-50"}`}>
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-lg font-bold ${isActive ? "bg-teal-500 text-white" : "bg-teal-100 text-teal-700"}`}>{recipient.name[0]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><h3 className="font-display text-base font-bold text-slate-900">{recipient.name} 어르신</h3>{isActive && <Badge tone="ok">선택됨</Badge>}</div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{recipient.address} · {recipient.age}세 · {recipient.gender === "female" ? "여성" : "남성"}</p>
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
              <div><h2 className="font-display font-bold text-slate-900">이번 주 방문 일정</h2><p className="mt-0.5 text-xs text-slate-400">2026.09.15 ~ 09.19</p></div>
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
                      <td className="px-5 py-3.5 text-slate-700">{v.cg} 요양보호사</td>
                      <td className="px-5 py-3.5"><Badge tone={v.tone}>{v.label}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-display font-bold text-slate-900">오늘 예정 방문</h2>
              <p className="mt-0.5 text-xs text-slate-400">2026년 9월 17일 (수)</p>
            </div>
            <div className="flex items-stretch">
              <div className="w-1.5 bg-teal-500 shrink-0" />
              <div className="flex flex-1 flex-wrap items-center justify-between gap-4 px-5 py-5">
                <div>
                  <Badge tone="info">오늘 예정</Badge>
                  <p className="mt-3 font-mono text-lg font-bold text-teal-700">09:00 ~ 12:00</p>
                  <p className="mt-1 font-display text-xl font-bold text-slate-900">박영희 요양보호사</p>
                  <p className="mt-0.5 text-sm text-slate-500">신체 지원 · 가사 지원 예정</p>
                </div>
                <button onClick={() => go("request")} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">일정 변경 요청</button>
              </div>
            </div>
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
    </div>
  );
}
