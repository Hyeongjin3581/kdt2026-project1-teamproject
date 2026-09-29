import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { TODAY } from "../../../constants";

export default function GuardianRecords() {
  const records = [];
  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">방문 기록</h1>
        <p className="mt-1 text-sm text-slate-500">연결된 수급자의 방문 활동 내역입니다.</p>
      </div>
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
              <tr>{["날짜", "방문 시간", "담당 요양보호사", "활동 내용", "상태"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{r.date}</td>
                  <td className="px-5 py-4 font-mono text-slate-600">{r.t}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{r.cg} 요양보호사</td>
                  <td className="px-5 py-4 text-xs leading-5 text-slate-500">{r.note}</td>
                  <td className="px-5 py-4"><Badge tone={r.tone}>완료</Badge></td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">조회된 방문 기록이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
