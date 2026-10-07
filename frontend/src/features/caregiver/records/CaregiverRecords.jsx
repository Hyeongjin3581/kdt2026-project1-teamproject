import { useEffect, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import LoadStatus from "../../../components/common/LoadStatus";
import CaregiverPageTitle from "../CaregiverPageTitle";
import { buildVisits } from "../../../utils/caregiverAdapters";

// 업무 기록 : 방문을 마친(근무기록 '완료') 내역을 날짜 역순으로 조회한다. (업무일지 저장 API 는 아직 없음)
export default function CaregiverRecords({ careworkerNo }) {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");

  // 업무 기록 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    setLoadError(null);
    try {
      const [mineRes, recipientsRes] = await Promise.all([
        axios.get("http://localhost:8080/careworkerreport/careworker", { params: { careworker_no: careworkerNo }, withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }),
      ]);
      const requestLists = await Promise.all(recipientsRes.data.map((r) =>
        axios.get("http://localhost:8080/request/carerecipient", { params: { carerecipient_no: r.careRecipientNo }, withCredentials: true }).catch(() => ({ data: [] }))
      ));
      const done = buildVisits({ reports: mineRes.data.filter((r) => r.workStatus === "완료"), requests: requestLists.flatMap((res) => res.data), recipients: recipientsRes.data });
      setRecords(done.reverse()); // 최근 방문이 위로
      setStatus("ok");
    } catch (error) {
      console.error("업무 기록 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, [careworkerNo]);

  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  const keyword = search.trim();
  const filtered = records.filter((v) => (!date || v.iso === date) && (!keyword || `${v.recipientName} ${v.content}`.includes(keyword)));

  return (
    <div className="space-y-5">
      <CaregiverPageTitle title="업무 기록" subtitle="방문을 마친 내역을 확인하세요." />
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3"><h2 className="font-display font-bold text-slate-900">완료한 방문 <span className="ml-1 text-sm text-teal-700">{filtered.length}건</span></h2><button type="button" onClick={loadData} className="text-xs font-semibold text-teal-600 hover:underline">새로고침</button></div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-slate-600">방문일<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1.5 block rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
            <label className="min-w-0 flex-1 basis-48 text-xs font-semibold text-slate-600">수급자 / 요청 내용 검색<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="수급자 이름, 요청 내용" className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
            <button type="button" onClick={() => { setDate(""); setSearch(""); }} disabled={!date && !search} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">초기화</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] whitespace-nowrap text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{["방문일", "시간", "수급자", "요청 내용", "상태"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead>
            <tbody>{filtered.map((v) => (
              <tr key={v.reportNo} className="border-t border-slate-100 hover:bg-slate-50/70">
                <td className="px-5 py-4 font-semibold text-slate-800">{v.date}</td>
                <td className="px-5 py-4 font-mono text-xs">{v.time}</td>
                <td className="px-5 py-4">{v.recipientName}</td>
                <td className="px-5 py-4 text-slate-600">{v.content || "-"}</td>
                <td className="px-5 py-4"><Badge tone="info">방문 완료</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-400">{records.length === 0 ? "완료한 방문 기록이 없습니다." : "검색 조건에 맞는 기록이 없습니다."}</p>}
      </Panel>
    </div>
  );
}
