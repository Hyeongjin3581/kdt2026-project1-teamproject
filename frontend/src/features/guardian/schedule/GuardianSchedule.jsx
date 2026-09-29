import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { TODAY } from "../../../constants";

export default function GuardianSchedule() {
  const week = [
    { day: "월 09.15", t: "09:00~12:00", cg: "박영희", tone: "ok", label: "방문 완료", note: "식사 보조 · 실내 걷기 · 혈압 정상" },
    { day: "수 09.17", t: "09:00~12:00", cg: "박영희", tone: "info", label: "오늘 예정", note: "신체 지원 · 가사 지원 예정" },
    { day: "금 09.19", t: "09:00~12:00", cg: "박영희", tone: "neutral", label: "예정", note: "방문 예정" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">방문 일정</h1>
        <p className="mt-1 text-sm text-slate-500">김순자 어르신의 이번 주 방문 일정입니다. 2026.09.15 ~ 09.19</p>
      </div>
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
              <tr>{["날짜", "방문 시간", "담당 요양보호사", "활동 내용", "상태"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {week.map((v, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-teal-700">{v.day}</td>
                  <td className="px-5 py-4 font-mono text-slate-700">{v.t}</td>
                  <td className="px-5 py-4 text-slate-700">{v.cg} 요양보호사</td>
                  <td className="px-5 py-4 text-slate-500">{v.note}</td>
                  <td className="px-5 py-4"><Badge tone={v.tone}>{v.label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel className="flex items-center gap-2 border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-800">
        <span className="text-teal-500">ℹ</span> 일정 변경이 필요하시면 <b>요청 · 문의</b> 메뉴에서 센터에 문의해 주세요.
      </Panel>
    </div>
  );
}
