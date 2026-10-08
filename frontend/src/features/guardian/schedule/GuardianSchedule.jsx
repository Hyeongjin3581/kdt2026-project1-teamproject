//
import { useEffect, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import LoadStatus from "../../../components/common/LoadStatus";
import { TODAY } from "../../../constants";
import { buildVisits, thisWeek } from "../../../utils/guardianAdapters";

export default function GuardianSchedule({ recipient }) {
  const [visits, setVisits] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);

  // 방문 일정 : 수급자의 방문 요청 + 근무기록 + 요양보호사를 axios로 조회 (axios.get("통신할주소", { 옵션 }) → response.data)
  async function loadData() {
    if (!recipient) { setStatus("ok"); return; }
    setStatus("loading");
    try {
      const [requestsRes, careworkersRes] = await Promise.all([
        axios.get("/request/carerecipient", { params: { careRecipientNo: recipient.id }, withCredentials: true }),
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
  useEffect(() => { loadData(); }, [recipient?.id]);

  const range = thisWeek();
  const week = visits.filter((v) => !v.cancelled && v.iso >= range.start && v.iso <= range.end);
  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">방문 일정</h1>
        <p className="mt-1 text-sm text-slate-500">{recipient ? `${recipient.name} 어르신` : "수급자"}의 이번 주 방문 일정입니다. {range.label}</p>
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
                  <td className="px-5 py-4 text-slate-700">{v.caregiver}</td>
                  <td className="px-5 py-4 text-slate-500">{v.note}</td>
                  <td className="px-5 py-4"><Badge tone={v.tone}>{v.label}</Badge></td>
                </tr>
              ))}
              {week.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">이번 주 방문 일정이 없습니다.</td></tr>}
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
