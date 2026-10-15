import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import ReviewRating from "../../../components/common/ReviewRating";
import ReviewDialog from "../../../components/common/ReviewDialog";
import AiReviewStats from "../dashboard/AiReviewStats";
import { aiErrorMessage, invalidAiResponse } from "../../../utils/aiError";

const sentiments = ["매우 긍정", "긍정", "중립", "부정", "매우 부정"];
const statusMeta = {
  analyzed: { label: "분석 완료", tone: "ok" },
  pending: { label: "분석 대기", tone: "warning" },
  noText: { label: "내용 없음", tone: "neutral" },
};
const button = "rounded-lg border border-teal-200 px-3 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50";
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const dateLabel = (value) => value ? value.replace("T", " ").slice(0, 16) : "정보 없음";
const validReview = (item) => item && Number.isInteger(item.reviewNo) && item.reviewNo > 0
  && Object.hasOwn(statusMeta, item.analysisStatus)
  && ["careworkersReportNo", "guardianName", "careworkerNo", "careworkerName", "rating", "reviewContent", "createDate", "updateDate", "sentiment", "analyzedAt"].every((key) => Object.hasOwn(item, key))
  && [item.guardianName, item.careworkerName, item.reviewContent, item.createDate, item.updateDate, item.analyzedAt].every((value) => value === null || typeof value === "string")
  && (item.analysisStatus === "analyzed" ? sentiments.includes(item.sentiment) : item.sentiment === null);

function ReviewSentiment({ review, failure }) {
  if (review.analysisStatus === "pending" && failure) return <Badge tone="danger">분석 실패</Badge>;
  if (review.analysisStatus !== "analyzed") return <Badge tone={statusMeta[review.analysisStatus].tone}>{statusMeta[review.analysisStatus].label}</Badge>;
  const tone = review.sentiment.includes("부정") ? "danger" : review.sentiment === "중립" ? "neutral" : "ok";
  return <Badge tone={tone}>✨ {review.sentiment}</Badge>;
}

function Rating({ value }) {
  return Number.isInteger(value) && value >= 1 && value <= 10 ? <ReviewRating rating={value} /> : <span className="text-xs text-slate-500">평점 정보 없음</span>;
}

export default function ServiceReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mismatchFilter = searchParams.get("mismatch") === "true";
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [selectedNo, setSelectedNo] = useState(null);
  const [analyzingNo, setAnalyzingNo] = useState(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [analysisFailures, setAnalysisFailures] = useState({});
  const analysisLock = useRef(false);
  const listRequest = useRef(null);
  const mounted = useRef(true);

  async function loadReviews() {
    if (!mounted.current) return;
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/ai/reviews", { withCredentials: true, signal: controller.signal });
      if (!Array.isArray(response.data) || !response.data.every(validReview)) throw invalidAiResponse(response);
      if (!controller.signal.aborted) {
        setReviews(response.data);
        setAnalysisFailures((previous) => {
          const next = {};
          response.data.forEach((review) => { if (review.analysisStatus === "pending" && previous[review.reviewNo]) next[review.reviewNo] = previous[review.reviewNo]; });
          return next;
        });
      }
    } catch (error) {
      if (!axios.isCancel(error) && !controller.signal.aborted) setError(aiErrorMessage(error, "review"));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    loadReviews();
    return () => { mounted.current = false; listRequest.current?.abort(); };
  }, []);

  async function refreshAll() {
    setRefreshKey((current) => current + 1);
    await loadReviews();
  }
  async function analyzeReview(review) {
    if (analysisLock.current || loading || error || review.analysisStatus !== "pending") return;
    analysisLock.current = true;
    setAnalyzingNo(review.reviewNo);
    setActionError("");
    setMessage("");
    setAnalysisFailures((previous) => ({ ...previous, [review.reviewNo]: null }));
    try {
      const response = await axios.post("/api/ai/reviews/analyze", {}, { params: { reviewNo: review.reviewNo }, withCredentials: true });
      const data = response.data;
      if (data?.reviewNo !== review.reviewNo || !sentiments.includes(data?.sentiment) || typeof data.cached !== "boolean") throw invalidAiResponse(response);
      if (mounted.current) setMessage(`선택한 후기: ${data.sentiment} · ${data.cached ? "저장된 분석 결과를 확인했습니다." : "분석을 완료했습니다."}`);
    } catch (error) {
      if (mounted.current) {
        const reason = aiErrorMessage(error, "review");
        setActionError(reason);
        setAnalysisFailures((previous) => ({ ...previous, [review.reviewNo]: reason }));
      }
    } finally {
      // 분석 중 후기 수정·삭제가 발생할 수도 있어 실패 후에도 최신 목록과 통계를 확인한다.
      if (mounted.current) await refreshAll();
      analysisLock.current = false;
      if (mounted.current) setAnalyzingNo(null);
    }
  }
  function recordBatchResults(results) {
    setAnalysisFailures((previous) => {
      const next = { ...previous };
      results.forEach((item) => { next[item.reviewNo] = typeof item.error === "string" ? item.error : null; });
      return next;
    });
  }
  function changeMismatchFilter(value) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value === "mismatch") next.set("mismatch", "true"); else next.delete("mismatch");
      return next;
    }, { replace: true });
  }
  const mismatchReady = reviews.length > 0 && reviews.every((review) => typeof review.ratingSentimentMismatch === "boolean");
  const displayedStatus = (review) => review.analysisStatus === "pending" && analysisFailures[review.reviewNo] ? "failed" : review.analysisStatus;

  const busy = batchBusy || analyzingNo !== null;
  const selected = !error && reviews.find((review) => review.reviewNo === selectedNo);
  const keyword = query.trim().toLowerCase();
  const rows = reviews.filter((review) =>
    (statusFilter === "all" || displayedStatus(review) === statusFilter)
    && (sentimentFilter === "all" || review.sentiment === sentimentFilter)
    && (!mismatchFilter || !mismatchReady || review.ratingSentimentMismatch === true)
    && `${review.guardianName ?? ""} ${review.careworkerName ?? ""} ${review.reviewContent ?? ""}`.toLowerCase().includes(keyword));

  return <div className="space-y-5">
    <SectionTitle allCenters title="서비스 후기" subtitle="전체 센터의 보호자 후기 원문·평점·AI 감정을 함께 확인하세요. 센터 선택 필터는 적용되지 않습니다." action={<button type="button" onClick={refreshAll} disabled={busy || loading} className={button}>후기·통계 새로고침</button>} />
    <AiReviewStats refreshKey={refreshKey} disabled={analyzingNo !== null || loading} analysisLock={analysisLock} onBusyChange={setBatchBusy} onAnalyzed={loadReviews} onAnalysisResults={recordBatchResults} />
    <Panel className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-display font-bold text-slate-900">개별 후기</h2>
        <p className="mt-1 text-xs text-slate-500">평점은 보호자가 매긴 만족도이며, AI 감정은 후기 원문을 분석한 별도 결과입니다.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input aria-label="후기 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="후기 내용·보호자·요양보호사 검색" className={`${field} w-full sm:w-80`} />
          <select aria-label="후기 분석 상태" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={field}><option value="all">전체 분석 상태</option>{Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}<option value="failed">분석 실패 (이번 화면)</option></select>
          <select aria-label="후기 감정" value={sentimentFilter} onChange={(event) => setSentimentFilter(event.target.value)} className={field}><option value="all">전체 감정</option>{sentiments.map((name) => <option key={name} value={name}>{name}</option>)}</select>
          <select aria-label="후기 평가 상태" value={mismatchFilter ? "mismatch" : "all"} onChange={(event) => changeMismatchFilter(event.target.value)} disabled={!mismatchReady || loading || Boolean(error)} className={`${field} disabled:bg-slate-50 disabled:text-slate-400`}><option value="all">전체 후기</option><option value="mismatch">평가 불일치 후기만 보기</option></select>
          <button type="button" onClick={() => { setQuery(""); setStatusFilter("all"); setSentimentFilter("all"); changeMismatchFilter("all"); }} className={button}>검색 조건 초기화</button>
        </div>
        {!loading && !error && <p className="mt-3 text-xs text-slate-500">전체 {reviews.length}건 중 {rows.length}건 표시 · 최신 작성순</p>}
        {!loading && !error && !mismatchReady && <p className="mt-2 text-xs text-slate-500">평가 불일치 필터 · 연결 준비. 불일치 정보가 아직 제공되지 않거나 확인할 후기가 없습니다.{mismatchFilter && " 현재는 전체 후기를 표시합니다."}</p>}
        {Object.values(analysisFailures).some(Boolean) && <p className="mt-2 text-xs text-slate-500">분석 실패는 이번 화면에서 시도한 결과입니다. 서버의 분석 대기 상태와 구분해 표시합니다.</p>}
        <div aria-live="polite">{message && <p className="mt-3 text-sm text-teal-700">{message}</p>}{actionError && <p role="alert" className="mt-3 text-sm text-red-600">{actionError}</p>}</div>
      </div>
      {loading ? <p role="status" className="p-8 text-center text-sm text-slate-500">후기 목록을 불러오는 중입니다...</p>
        : error ? <div className="p-8 text-center"><p role="alert" className="text-sm text-red-600">{error}</p><button type="button" onClick={loadReviews} disabled={busy} className={`${button} mt-3`}>후기 목록 다시 불러오기</button></div>
          : reviews.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">등록된 서비스 후기가 없습니다.</p>
            : rows.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">검색 조건에 맞는 후기가 없습니다.</p>
              : <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{["작성일", "보호자", "요양보호사", "평점", "후기 내용", "AI 감정 / 상태", "평가 불일치", "확인"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
                <tbody>{rows.map((review) => <tr key={review.reviewNo} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{dateLabel(review.createDate)}</td>
                  <td className="px-4 py-4 text-slate-700">{review.guardianName ?? "정보 없음"}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{review.careworkerName ?? "정보 없음"}</td>
                  <td className="px-4 py-4"><Rating value={review.rating} /></td>
                  <td className="max-w-72 px-4 py-4"><p className="break-words text-slate-700">{review.reviewContent?.trim() ? review.reviewContent.length > 80 ? `${review.reviewContent.slice(0, 80)}…` : review.reviewContent : "작성된 내용이 없습니다."}</p></td>
                  <td className="whitespace-nowrap px-4 py-4"><ReviewSentiment review={review} failure={analysisFailures[review.reviewNo]} /></td>
                  <td className="whitespace-nowrap px-4 py-4">{review.ratingSentimentMismatch === true
                    ? <button type="button" title={typeof review.mismatchReason === "string" ? review.mismatchReason : "불일치 사유를 확인하세요."} onClick={() => { setSelectedNo(review.reviewNo); setActionError(""); setMessage(""); }} className="rounded-md bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100">⚠ 검토 필요</button>
                    : review.ratingSentimentMismatch === false ? <span className="text-xs text-slate-400">—</span> : <span className="text-xs text-slate-400">정보 없음</span>}</td>
                  <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setSelectedNo(review.reviewNo); setActionError(""); setMessage(""); }} className={button}>원문 보기</button>
                    {review.analysisStatus === "pending" && <button type="button" onClick={() => analyzeReview(review)} disabled={busy || loading} className={button}>{analyzingNo === review.reviewNo ? "분석 중..." : "분석하기"}</button>}</div></td>
                </tr>)}</tbody>
              </table></div>}
    </Panel>
    {selected && <ReviewDialog title="서비스 후기 상세" busy={busy} onClose={() => setSelectedNo(null)}>
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">보호자</p><p className="mt-1 font-semibold">{selected.guardianName ?? "정보 없음"}</p></div><div><p className="text-xs text-slate-500">요양보호사</p><p className="mt-1 font-semibold">{selected.careworkerName ?? "정보 없음"}</p></div></div>
        <div><p className="mb-2 text-xs text-slate-500">보호자 만족도</p><Rating value={selected.rating} /></div>
        {selected.ratingSentimentMismatch === true && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><h3 className="text-sm font-bold text-amber-800">⚠ 검토 필요</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{typeof selected.mismatchReason === "string" && selected.mismatchReason.trim() ? selected.mismatchReason : "불일치 사유가 제공되지 않았습니다."}</p><p className="mt-2 text-xs text-slate-500">서버에서 평가 불일치로 표시한 후기입니다. 평점·감정 결과를 변경하거나 후기를 숨기지 않습니다.</p></div>}
        <div><h3 className="text-sm font-bold text-slate-800">후기 원문</h3><p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-sm leading-6">{selected.reviewContent?.trim() ? selected.reviewContent : "작성된 내용이 없습니다."}</p></div>
        <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-4"><h3 className="mb-2 text-sm font-bold text-teal-800">✨ AI 감정 분석</h3><ReviewSentiment review={selected} failure={analysisFailures[selected.reviewNo]} />
          {selected.analysisStatus === "pending" && analysisFailures[selected.reviewNo] && <p role="alert" className="mt-2 text-sm text-red-600">{analysisFailures[selected.reviewNo]}</p>}
          <p className="mt-2 text-xs text-slate-500">{selected.analysisStatus === "analyzed" ? `분석일: ${dateLabel(selected.analyzedAt)}` : selected.analysisStatus === "pending" ? "현재 후기 내용에 대한 분석이 필요합니다. 이전 감정 결과는 표시하지 않습니다." : "내용이 없는 후기는 분석 대상에서 제외됩니다."}</p></div>
        <p className="text-xs text-slate-500">작성일: {dateLabel(selected.createDate)}<br />수정일: {dateLabel(selected.updateDate)}</p>
        <div aria-live="polite">{loading && <p className="text-sm text-slate-500">최신 후기를 불러오는 중입니다...</p>}{message && <p className="text-sm text-teal-700">{message}</p>}{actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}</div>
        <div className="flex justify-end gap-2">{selected.analysisStatus === "pending" && <button type="button" onClick={() => analyzeReview(selected)} disabled={busy || loading} className={button}>{analyzingNo === selected.reviewNo ? "분석 중..." : "이 후기 분석하기"}</button>}<button type="button" onClick={() => setSelectedNo(null)} disabled={busy} className={button}>닫기</button></div>
      </div>
    </ReviewDialog>}
  </div>;
}
