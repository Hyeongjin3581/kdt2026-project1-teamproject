import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import { Link } from "react-router-dom";
import { aiErrorMessage, invalidAiResponse } from "../../../utils/aiError";

const sentiments = [
  ["매우 긍정", "bg-teal-600"], ["긍정", "bg-emerald-400"], ["중립", "bg-slate-400"],
  ["부정", "bg-amber-400"], ["매우 부정", "bg-rose-500"],
];
const button = "rounded-lg border border-teal-200 px-4 py-2.5 text-sm font-bold text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function AiReviewStats({ compact = false, refreshKey = 0, disabled = false, analysisLock, onBusyChange, onAnalyzed, onAnalysisResults }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const localBusy = useRef(false);
  const mounted = useRef(true);
  const busy = analysisLock || localBusy;

  async function loadStats(signal) {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/ai/reviews/stats", { withCredentials: true, signal });
      const data = response.data;
      const validNumber = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
      if (!data || ![data.total, data.analyzed, data.pending, data.noText].every(validNumber)
        || !sentiments.every(([name]) => validNumber(data.counts?.[name]) && validNumber(data.percentages?.[name]) && data.percentages[name] <= 100)) {
        throw invalidAiResponse(response);
      }
      if (!signal?.aborted) setStats(data);
    } catch (error) {
      if (!axios.isCancel(error) && !signal?.aborted) { setStats(null); setError(aiErrorMessage(error)); }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    loadStats(controller.signal);
    return () => { mounted.current = false; controller.abort(); };
  }, [refreshKey]);

  async function analyzePending() {
    if (busy.current) return;
    busy.current = true;
    onBusyChange?.(true);
    setAnalyzing(true);
    setError("");
    setResult("");
    try {
      const response = await axios.post("/api/ai/reviews/analyze-pending", {}, { withCredentials: true });
      if (!mounted.current) return;
      if (!Array.isArray(response.data) || !response.data.every((item) => item && item.reviewNo != null
        && (typeof item.error === "string" || sentiments.some(([name]) => name === item.sentiment)))) throw invalidAiResponse(response);
      const failed = response.data.filter((item) => typeof item.error === "string").length;
      onAnalysisResults?.(response.data);
      setResult(`분석 결과: 성공 ${response.data.length - failed}건 · 실패 ${failed}건${response.data.length === 0 ? " (처리할 후기가 없습니다.)" : ""}`);
    } catch (error) {
      if (mounted.current) setResult(aiErrorMessage(error));
    } finally {
      // 일부만 처리되거나 요청이 실패한 경우에도 최신 대기 건수를 다시 확인한다.
      if (mounted.current) { await loadStats(); await onAnalyzed?.(); }
      busy.current = false;
      if (mounted.current) { setAnalyzing(false); onBusyChange?.(false); }
    }
  }

  return <Panel className="p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="font-display font-bold text-slate-900">{compact ? "서비스 후기 현황" : "✨ AI 후기 감정 분석"}</h2>
        <p className="mt-1 text-sm text-slate-500">{compact ? "보호자 후기와 분석 대기 현황을 확인하세요." : "보호자가 작성한 후기를 Gemini AI가 5단계로 분석한 결과입니다."}</p>
        <p className="mt-2 text-xs font-bold text-teal-700">전체 센터 기준 · 센터 선택 필터와 무관한 통계</p></div>
      <div className="flex flex-wrap gap-2">
        {compact ? <Link to="/admin/reviews" className={button}>서비스 후기 보기 →</Link>
          : <button type="button" onClick={analyzePending} disabled={disabled || loading || analyzing || !stats || stats.pending === 0} className={button}>{analyzing ? "분석 중..." : "미분석 후기 분석"}</button>}
        <button type="button" onClick={() => loadStats()} disabled={disabled || loading || analyzing} className={button}>통계 새로고침</button>
      </div>
    </div>
    <div aria-live="polite">
      {loading && <p className="mt-4 text-sm text-slate-500">후기 통계를 불러오는 중입니다...</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      {result && <p className="mt-4 text-sm text-slate-700">{result}</p>}
    </div>
    {stats && !loading && <>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(compact ? [["전체 후기", stats.total], ["분석 대기 후기", stats.pending], ["부정", stats.counts["부정"]], ["매우 부정", stats.counts["매우 부정"]]]
          : [["전체 후기", stats.total], ["분석된 후기", stats.analyzed], ["분석 대기 후기", stats.pending], ["내용이 없는 후기", stats.noText]]).map(([label, count]) =>
          <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{count}건</p></div>)}
      </div>
      {Number.isInteger(stats.mismatchCount) && stats.mismatchCount >= 0
        ? <Link to="/admin/reviews?mismatch=true" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm"><span className="font-semibold text-amber-800">평가 불일치 <b className="ml-2">{stats.mismatchCount}건</b></span><span className="text-xs font-bold text-teal-700">검토 필요 후기 보기 →</span></Link>
        : <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500"><b>평가 불일치 · 연결 준비</b><p className="mt-1">불일치 통계 정보가 아직 제공되지 않습니다.</p></div>}
      {!compact && <><p className="mt-4 text-xs text-slate-500">비율은 분석 완료된 후기 기준입니다.</p>
      <div className="mt-3 space-y-3">
        {sentiments.map(([name, color]) => <div key={name}>
          <div className="mb-1 flex justify-between text-sm"><span className="text-slate-700">{name}</span><span className="font-semibold text-slate-700">{stats.counts[name]}건 · {stats.percentages[name]}%</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${name} ${stats.counts[name]}건, ${stats.percentages[name]}%`}><div className={`h-full rounded-full ${color}`} style={{ width: `${stats.percentages[name]}%` }} /></div>
        </div>)}
      </div>
      </>}
      {compact && <p className="mt-3 text-xs text-slate-500">부정·매우 부정 건수는 AI 분석이 완료된 후기 기준입니다.</p>}
      <p className="mt-4 text-sm text-slate-500">{stats.total === 0 ? "등록된 후기가 없습니다."
        : stats.pending > 0 ? compact ? `서비스 후기 페이지에서 대기 후기 ${stats.pending}건을 분석할 수 있습니다.` : `한 번에 최대 10건을 처리합니다. 대기 후기 ${stats.pending}건은 버튼을 눌러 분석해주세요.`
          : stats.analyzed === 0 ? "분석할 내용이 있는 후기가 없습니다. 내용이 없는 후기는 분석 대상에서 제외됩니다." : "분석 대기 후기가 없습니다."}</p>
    </>}
  </Panel>;
}
