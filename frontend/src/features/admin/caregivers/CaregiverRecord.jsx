//
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { WEEK_LIMIT } from "../../../constants";

const statusTone = (s) => (s === "완료" ? "ok" : s === "취소" ? "warning" : "neutral");

export default function CaregiverRecord({ c, onClose, onChanged }) {
  const rows = c.records;

  // 근무 기록 상태 변경 : PUT /careworkerreport?careworker_report_no=번호&work_status=상태
  const changeStatus = async (reportNo, status) => {
    try {
      const response = await axios.put("/careworkerreport", null, { params: { careworkersReportNo: reportNo, workStatus: status }, withCredentials: true });
      if (response.data) onChanged();
      else alert("상태 변경에 실패했습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  // 근무 기록 삭제 : DELETE /careworkerreport?careworker_report_no=번호
  const removeReport = async (reportNo) => {
    if (!window.confirm("이 근무 기록을 삭제할까요?")) return;
    try {
      const response = await axios.delete("/careworkerreport", { params: { careworkersReportNo: reportNo }, withCredentials: true });
      if (response.data) onChanged();
      else alert("삭제에 실패했습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-[#f4f8f7] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <Badge tone="info">근무 기록</Badge>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-teal-100 font-display text-xl font-bold text-teal-700">{c.name[0]}</div>
          <div><h2 className="font-display text-xl font-bold text-slate-900">{c.name} 요양보호사</h2><p className="text-xs text-slate-400">{c.gender} · 이번 주 {c.week}/{WEEK_LIMIT}시간</p></div>
        </div>
        <Panel className="mt-4 overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400"><tr>{["날짜", "수급자", "방문시간", "근무", "상태", ""].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{r[0]}</td>
                  <td className="px-5 py-3.5 text-slate-700">{r[1]}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{r[2]}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">{r[3]}</td>
                  <td className="px-5 py-3.5"><Badge tone={statusTone(r[4])}>{r[4]}</Badge></td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    {r[4] !== "완료" && <button onClick={() => changeStatus(r[5], "완료")} className="mr-2 text-[11px] font-bold text-teal-600 hover:underline">완료</button>}
                    <button onClick={() => removeReport(r[5])} className="text-[11px] font-bold text-red-500 hover:underline">삭제</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">근무 기록이 없습니다.</td></tr>}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
