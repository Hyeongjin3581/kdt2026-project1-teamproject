import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import LoadStatus from "../../../components/common/LoadStatus";
import CaregiverPageTitle from "../CaregiverPageTitle";
import { buildVisits } from "../../../utils/caregiverAdapters";
import ReviewRating from "../../../components/common/ReviewRating";
import CaregiverReviewModal from "./CaregiverReviewModal";

// 업무 기록 : 방문을 마친(근무기록 '완료') 내역을 날짜 역순으로 조회한다. (업무일지 저장 API 는 아직 없음)
export default function CaregiverRecords({ careworkerNo }) {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewStatus, setReviewStatus] = useState("loading");
  const [selected, setSelected] = useState(null);
  const [loadedFor, setLoadedFor] = useState(null);
  const dataRequest = useRef(null);
  const reviewRequest = useRef(null);

  async function loadReviews() {
    reviewRequest.current?.abort();
    const controller = new AbortController();
    reviewRequest.current = controller;
    setReviews([]);
    setReviewStatus("loading");
    try {
      const response = await axios.get("/api/review/careworker/my", { withCredentials: true, signal: controller.signal });
      if (!Array.isArray(response.data)) throw new Error("후기 목록 응답이 배열이 아닙니다.");
      if (controller.signal.aborted) return;
      setReviews(response.data);
      setReviewStatus("ok");
    } catch (error) {
      if (!controller.signal.aborted) setReviewStatus("error");
    }
  }

  // 업무 기록 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    dataRequest.current?.abort();
    const controller = new AbortController();
    dataRequest.current = controller;
    setStatus("loading");
    setRecords([]);
    setSelected(null);
    setLoadError(null);
    try {
      const [mineRes, recipientsRes] = await Promise.all([
        axios.get("http://localhost:8080/careworkerreport/careworker", { params: { careworkerNo: careworkerNo }, withCredentials: true, signal: controller.signal }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true, signal: controller.signal }),
      ]);
      const requestLists = await Promise.all(recipientsRes.data.map((r) =>
        axios.get("http://localhost:8080/request/carerecipient", { params: { careRecipientNo: r.careRecipientNo }, withCredentials: true, signal: controller.signal }).catch(() => ({ data: [] }))
      ));
      if (controller.signal.aborted) return;
      const done = buildVisits({ reports: mineRes.data.filter((r) => r.workStatus === "완료"), requests: requestLists.flatMap((res) => res.data), recipients: recipientsRes.data });
      setRecords(done.reverse()); // 최근 방문이 위로
      setLoadedFor(careworkerNo);
      setStatus("ok");
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("업무 기록 조회 실패:", error);
      setLoadError(error);
      setLoadedFor(careworkerNo);
      setStatus("error");
    }
  }
  useEffect(() => {
    loadData();
    loadReviews();
    return () => { dataRequest.current?.abort(); reviewRequest.current?.abort(); };
  }, [careworkerNo]);

  if (loadedFor !== careworkerNo) return <LoadStatus status="loading" />;
  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  const keyword = search.trim();
  const filtered = records.filter((v) => (!date || v.iso === date) && (!keyword || `${v.recipientName} ${v.content}`.includes(keyword)));
  const reviewByReport = new Map(reviews.map((review) => [review.careworkersReportNo, review]));

  return (
    <div className="space-y-5">
      <CaregiverPageTitle title="업무 기록" subtitle="방문을 마친 내역을 확인하세요." />
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3"><h2 className="font-display font-bold text-slate-900">완료한 방문 <span className="ml-1 text-sm text-teal-700">{filtered.length}건</span></h2><button type="button" onClick={() => { loadData(); loadReviews(); }} className="text-xs font-semibold text-teal-600 hover:underline">새로고침</button></div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-slate-600">방문일<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1.5 block rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
            <label className="min-w-0 flex-1 basis-48 text-xs font-semibold text-slate-600">수급자 / 요청 내용 검색<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="수급자 이름, 요청 내용" className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
            <button type="button" onClick={() => { setDate(""); setSearch(""); }} disabled={!date && !search} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">초기화</button>
          </div>
        </div>
        {reviewStatus === "error" && <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">후기 조회에 실패했습니다. 서버 연결과 로그인 상태를 확인해주세요.<button type="button" onClick={loadReviews} className="rounded-lg border border-rose-200 px-3 py-2 font-semibold">후기 다시 조회</button></div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] whitespace-nowrap text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{["방문일", "시간", "수급자", "요청 내용", "상태", "후기"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead>
            <tbody>{filtered.map((v) => {
              const review = reviewByReport.get(v.reportNo);
              return <tr key={v.reportNo} className="border-t border-slate-100 hover:bg-slate-50/70">
                <td className="px-5 py-4 font-semibold text-slate-800">{v.date}</td>
                <td className="px-5 py-4 font-mono text-xs">{v.time}</td>
                <td className="px-5 py-4">{v.recipientName}</td>
                <td className="px-5 py-4 text-slate-600">{v.content || "-"}</td>
                <td className="px-5 py-4"><Badge tone="info">방문 완료</Badge></td>
                <td className="px-5 py-4">
                  {reviewStatus === "loading" ? <span className="text-xs text-slate-400">후기 조회 중...</span>
                    : reviewStatus === "error" ? <span className="text-xs text-rose-600">후기 조회 실패</span>
                      : review ? <div className="space-y-2"><ReviewRating rating={review.rating} /><button type="button" onClick={() => setSelected({ record: v, review })} className="block min-h-10 rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50">후기 보기</button></div>
                        : <span className="text-xs text-slate-400">후기 없음</span>}
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-400">{records.length === 0 ? "완료한 방문 기록이 없습니다." : "검색 조건에 맞는 기록이 없습니다."}</p>}
      </Panel>
      {selected && <CaregiverReviewModal record={selected.record} review={selected.review} onClose={() => setSelected(null)} />}
    </div>
  );
}
