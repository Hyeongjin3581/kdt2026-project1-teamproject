//
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import LoadStatus from "../../../components/common/LoadStatus";
import { TODAY } from "../../../constants";
import { buildVisits } from "../../../utils/guardianAdapters";
import ReviewRating from "../../../components/common/ReviewRating";
import GuardianReviewModal from "./GuardianReviewModal";

export default function GuardianRecords({ recipient, recipients = [], onSelectRecipient }) {
  const [visits, setVisits] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStatus, setReviewStatus] = useState("loading");
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const dataRequest = useRef(null);
  const reviewRequest = useRef(null);

  async function loadReviews() {
    reviewRequest.current?.abort();
    const controller = new AbortController();
    reviewRequest.current = controller;
    setReviews([]);
    setReviewStatus("loading");
    if (!recipient) { setReviewStatus("ok"); return; }
    try {
      const response = await axios.get("/api/review/guardian/my", { withCredentials: true, signal: controller.signal });
      if (!Array.isArray(response.data)) throw new Error("후기 목록 응답이 배열이 아닙니다.");
      if (controller.signal.aborted) return;
      setReviews(response.data);
      setReviewStatus("ok");
    } catch (error) {
      if (!controller.signal.aborted) setReviewStatus("error");
    }
  }

  // 방문 일정 : 수급자의 방문 요청 + 근무기록 + 요양보호사를 axios로 조회 (axios.get("통신할주소", { 옵션 }) → response.data)
  async function loadData() {
    dataRequest.current?.abort();
    const controller = new AbortController();
    dataRequest.current = controller;
    setVisits([]);
    setLoadError(null);
    if (!recipient) { setStatus("ok"); return; }
    setStatus("loading");
    try {
      const [requestsRes, careworkersRes] = await Promise.all([
        axios.get("/request/carerecipient", { params: { careRecipientNo: recipient.id }, withCredentials: true, signal: controller.signal }),
        axios.get("/api/careworkers", { withCredentials: true, signal: controller.signal }),
      ]);
      const reportLists = await Promise.all([...new Set(careworkersRes.data.map((c) => c.centerNo))].map((no) =>
        axios.get("/careworkerreport/center", { params: { centerNo: no }, withCredentials: true, signal: controller.signal }).catch(() => ({ data: [] }))
      ));
      if (controller.signal.aborted) return;
      setVisits(buildVisits({ requests: requestsRes.data, reports: reportLists.flatMap((res) => res.data), careworkers: careworkersRes.data }));
      setStatus("ok");
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("방문 일정 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
    }
  }
  useEffect(() => {
    loadData();
    loadReviews();
    return () => { dataRequest.current?.abort(); reviewRequest.current?.abort(); };
  }, [recipient?.id]);

  const records = visits.filter((v) => v.done).sort((a, b) => b.iso.localeCompare(a.iso)).map((v) => ({ ...v, tone: "ok" }));
  // 근무번호로만 후기를 연결한다. 요청번호나 배열 순서는 사용하지 않는다.
  const reviewByReport = new Map(reviews.map((review) => [review.careworkersReportNo, review]));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">방문 기록</h1>
        <p className="mt-1 text-sm text-slate-500">{recipient ? `${recipient.name} 어르신` : "수급자"}의 최근 방문 활동 내역입니다.</p>
        </div>
        {recipient && <label className="text-xs font-semibold text-slate-600">방문기록 대상 어르신
          <select aria-label="방문기록 대상 어르신 선택" value={recipient.id} onChange={(event) => onSelectRecipient(Number(event.target.value))} className="ml-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
            {recipients.map((item) => <option key={item.id} value={item.id}>{item.name} 어르신</option>)}
          </select>
        </label>}
      </div>
      {notice && <p role="status" className="text-sm font-semibold text-teal-700">{notice}</p>}
      {!recipient ? <Panel className="p-8 text-center text-sm text-slate-500">연결된 수급자가 없습니다. 수급자를 등록한 뒤 방문기록을 확인해주세요.</Panel>
        : status !== "ok" ? <LoadStatus status={status} onRetry={loadData} error={loadError} />
        : <Panel className="overflow-hidden">
        {reviewStatus === "error" && <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">후기 조회에 실패했습니다. 서버 연결과 로그인 상태를 확인해주세요.<button type="button" onClick={loadReviews} className="rounded-lg border border-rose-200 px-3 py-2 font-semibold">후기 다시 조회</button></div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
              <tr>{["날짜", "방문 시간", "담당 요양보호사", "활동 내용", "상태", "후기"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const review = reviewByReport.get(r.reportNo);
                const canReview = r.reportNo != null && r.workStatus === "완료";
                return <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{r.date}</td>
                  <td className="px-5 py-4 font-mono text-slate-600">{r.t}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{r.cg} 요양보호사</td>
                  <td className="px-5 py-4 text-xs leading-5 text-slate-500">{r.note}</td>
                  <td className="px-5 py-4"><Badge tone={r.tone}>완료</Badge></td>
                  <td className="px-5 py-4">
                    {!canReview ? <span className="text-xs text-slate-400">후기 작성 불가 · 완료 근무기록 없음</span>
                      : reviewStatus === "loading" ? <span className="text-xs text-slate-400">후기 조회 중...</span>
                        : reviewStatus === "error" ? <span className="text-xs text-rose-600">후기 조회 실패</span>
                          : <div className="space-y-2">{review && <ReviewRating rating={review.rating} />}<button type="button" onClick={() => setSelected({ record: r, review })} className="block min-h-10 whitespace-nowrap rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50">{review ? "후기 보기·수정" : "후기 작성"}</button></div>}
                  </td>
                </tr>;
              })}
              {records.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">방문 기록이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>}
      {selected && <GuardianReviewModal record={selected.record} review={selected.review} recipient={recipient} onClose={() => setSelected(null)} onSaved={(message) => { setSelected(null); setNotice(message); loadReviews(); }} />}
    </div>
  );
}
