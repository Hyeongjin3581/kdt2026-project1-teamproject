import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { WEEK_LIMIT } from "../../../constants";
import { caregiverRecords } from "../../../data/caregivers";

export default function CaregiverRecord({ c, onClose }) {
  const rows = caregiverRecords[c.id] ?? [];
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-[#f4f8f7] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <Badge tone="info">근무 기록</Badge>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-teal-100 font-display text-xl font-bold text-teal-700">{c.name[0]}</div>
          <div><h2 className="font-display text-xl font-bold text-slate-900">{c.name} 요양보호사</h2><p className="text-xs text-slate-400">{c.gender} · {c.area} · 이번 주 {c.week}/{WEEK_LIMIT}시간</p></div>
        </div>
        <Panel className="mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400"><tr>{["날짜", "수급자", "방문시간", "근무", "상태"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r[0]}</td>
                  <td className="px-4 py-3 text-slate-700">{r[1]}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r[2]}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{r[3]}</td>
                  <td className="px-4 py-3"><Badge tone={r[4]}>{r[4] === "warning" ? "이동주의" : "완료"}</Badge></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">조회된 근무 기록이 없습니다.</td></tr>}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
