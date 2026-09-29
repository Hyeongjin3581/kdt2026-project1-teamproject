import { useMemo, useState } from "react";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { useCenter, inCenter } from "../../../context/CenterContext";
import { recipients } from "../../../data/recipients";
import RecipientDetail from "./RecipientDetail";

export default function Recipients() {
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState(null);
  const center = useCenter();
  const visible = useMemo(() => recipients.filter(inCenter(center)).filter((r) => `${r.name}${r.area}${r.cg}${r.guardian}`.includes(q)), [q, center]);
  return (
    <div className="space-y-5">
      <SectionTitle title="수급자 관리" subtitle="센터에서 방문요양 서비스를 제공받는 수급(어르신) 목록입니다. 로그인하는 보호자와는 별도로 관리됩니다." action={<button onClick={() => setQ("")} className="rounded-lg border border-teal-200 bg-white px-4 py-2.5 text-sm font-bold text-teal-700 transition hover:bg-teal-50">↻ 새로고침</button>} />
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="수급자명, 거주 지역, 담당자, 보호자 검색" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-80" />
          <button className="rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">지역 전체 ▾</button>
          <button className="rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">상태 전체 ▾</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400"><tr>{["수급자명", "성별", "거주 지역", "방문 요일", "담당 요양보호사", "연결된 보호자", "상태", ""].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.name} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-5 py-4"><b className="text-slate-800">{r.name}</b><p className="mt-1 text-xs text-slate-400">{r.grade}</p></td>
                  <td className="px-5 py-4 text-slate-600">{r.gender}</td>
                  <td className="px-5 py-4 text-slate-600">{r.area}</td>
                  <td className="px-5 py-4"><div className="space-y-0.5">{r.schedule.map(([d, t]) => <p key={d} className="text-xs text-slate-600"><b className="text-slate-700">{d}</b> <span className="font-mono text-slate-500">{t}</span></p>)}</div></td>
                  <td className="px-5 py-4 text-slate-700">{r.cg}</td>
                  <td className="px-5 py-4 text-slate-600">{r.guardian}</td>
                  <td className="px-5 py-4"><Badge tone={r.tone}>{r.status}</Badge></td>
                  <td className="px-5 py-4"><button onClick={() => setDetail(r)} className="text-xs font-bold text-teal-600 hover:underline">상세 →</button></td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">선택한 센터에 등록된 수급자가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
      {detail && <RecipientDetail r={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
