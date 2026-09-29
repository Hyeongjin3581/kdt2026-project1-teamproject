import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { TODAY } from "../../../constants";

export default function GuardianRecords() {
  const records = [
    { date: "09.15 (월)", cg: "박영희", t: "09:00~12:00", note: "식사 보조 · 실내 걷기 운동 · 혈압 정상", tone: "ok" },
    { date: "09.12 (금)", cg: "박영희", t: "09:00~12:00", note: "가사 지원(청소) · 산책 30분 · 컨디션 양호", tone: "ok" },
    { date: "09.10 (수)", cg: "김미영", t: "13:00~16:00", note: "식사 보조 · 목욕 지원 · 특이사항 없음", tone: "ok" },
    { date: "09.08 (월)", cg: "박영희", t: "09:00~12:00", note: "혈압 측정 · 복약 확인 · 가사 지원", tone: "ok" },
    { date: "09.05 (금)", cg: "박영희", t: "09:00~12:00", note: "산책 40분 · 식사 보조 · 컨디션 양호", tone: "ok" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">방문 기록</h1>
        <p className="mt-1 text-sm text-slate-500">김순자 어르신의 최근 방문 활동 내역입니다.</p>
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
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
