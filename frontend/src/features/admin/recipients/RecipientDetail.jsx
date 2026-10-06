import { useState } from "react";
import Panel from "../../../components/common/Panel";
import RecipientEditModal from "../../../components/common/RecipientEditModal";
import Badge from "../../../components/common/Badge";

export default function RecipientDetail({ r, onClose, onChanged }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-[#f4f8f7] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <Badge tone="info">수급자 상세</Badge>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-teal-100 font-display text-xl font-bold text-teal-700">{r.name[0]}</div>
          <div><h2 className="font-display text-xl font-bold text-slate-900">{r.name}</h2><p className="text-xs text-slate-400">{r.gender} · {r.grade}</p></div>
          <Badge tone={r.tone}>{r.status}</Badge>
        </div>
        <div className="mt-3"><button onClick={() => setEditing(true)} className="rounded-lg border border-teal-200 bg-white px-4 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-50">✎ 정보 수정 · 삭제</button></div>
        <Panel className="mt-4 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">기본 정보</h3>
          <div className="mt-3 space-y-2 text-sm">
            {[["거주 지역", r.area], ["연결된 보호자", r.guardian], ["현재 담당 요양보호사", r.cg]].map(([l, v]) => (
              <div key={l} className="flex justify-between border-b border-slate-100 pb-2 last:border-0"><span className="text-slate-400">{l}</span><b className="text-slate-700">{v}</b></div>
            ))}
          </div>
        </Panel>
        <Panel className="mt-4 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">요일별 방문 일정</h3>
          <div className="mt-3 space-y-2">
            {r.schedule.map(([d, t]) => (
              <div key={d + t} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm"><b className="text-slate-700">{d}</b><span className="font-mono text-slate-600">{t}</span></div>
            ))}
          </div>
        </Panel>
        <Panel className="mt-4 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">방문 이력</h3>
          <div className="mt-3 space-y-3">
            {r.history.map(([date, cg, note]) => (
              <div key={date + note} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-center justify-between"><b className="font-mono text-xs text-slate-500">{date}</b><span className="text-xs text-slate-600">{cg} 요양보호사</span></div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      {editing && <RecipientEditModal recipient={r.raw} onClose={() => setEditing(false)} onChanged={() => { setEditing(false); onChanged(); }} />}
    </div>
  );
}
