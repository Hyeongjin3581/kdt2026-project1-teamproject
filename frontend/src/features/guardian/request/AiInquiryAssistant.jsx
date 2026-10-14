import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import { aiErrorMessage, invalidAiResponse } from "../../../utils/aiError";

export default function AiInquiryAssistant({ categories = [], categoriesLoading = false, requestNo, onSaved, onScheduleGuide }) {
  const [categoryNo, setCategoryNo] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const locked = useRef(false);
  const currentCategory = useRef("");
  const draftRequest = useRef(null);
  const mounted = useRef(true);
  const submissionKey = `${categoryNo}|${requestNo ?? ""}|${question.trim()}`;
  const alreadySaved = submitted?.key === submissionKey;
  const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500";

  useEffect(() => {
    if (!locked.current && categories.length && !categories.some((category) => String(category.inquiryCategoryNo) === categoryNo)) {
      selectCategory(String(categories[0].inquiryCategoryNo));
    }
  }, [categories]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; draftRequest.current?.abort(); };
  }, []);

  function selectCategory(value) {
    if (locked.current) return;
    draftRequest.current?.abort();
    currentCategory.current = value;
    setCategoryNo(value); setDrafts([]); setQuestion(""); setResult(null); setError("");
  }

  async function loadDrafts() {
    if (!categoryNo || locked.current) return;
    locked.current = true; setBusy("drafts"); setError("");
    const requested = categoryNo;
    currentCategory.current = requested;
    const controller = new AbortController();
    draftRequest.current?.abort();
    draftRequest.current = controller;
    try {
      const response = await axios.post("/api/ai/inquiries/drafts", {}, {
        params: { inquiryCategoryNo: Number(requested) }, withCredentials: true, signal: controller.signal,
      });
      if (controller.signal.aborted || currentCategory.current !== requested) return;
      if (String(response.data?.inquiryCategoryNo) !== requested || !Array.isArray(response.data?.questions)
        || !response.data.questions.every((item) => typeof item === "string" && item.trim() && item.length <= 1000)) throw invalidAiResponse(response);
      setDrafts(response.data.questions);
    } catch (error) {
      if (!axios.isCancel(error) && mounted.current && currentCategory.current === requested) setError(aiErrorMessage(error));
    } finally { locked.current = false; if (mounted.current) setBusy(""); }
  }

  async function answer() {
    if (locked.current || !categoryNo || !question.trim() || alreadySaved) return;
    if (question.trim().length > 1000) { setError("문의 내용은 1,000자 이내로 입력해주세요."); return; }
    locked.current = true; setBusy("answer"); setError(""); setResult(null);
    const requested = categoryNo;
    const submittedKey = submissionKey;
    try {
      const response = await axios.post("/api/ai/inquiries/answer", {
        inquiryCategoryNo: categoryNo, question: question.trim(), requestNo: requestNo == null ? null : String(requestNo),
      }, { withCredentials: true });
      const data = response.data;
      if (!data || data.inquiryNo == null || String(data.inquiryCategoryNo) !== requested
        || typeof data.answer !== "string" || !data.answer.trim() || typeof data.needsStaff !== "boolean"
        || !["응답 대기", "응답 완료"].includes(data.status)
        || data.status !== (data.needsStaff ? "응답 대기" : "응답 완료")) throw invalidAiResponse(response);
      if (!mounted.current || currentCategory.current !== requested) return;
      setResult(data);
      setSubmitted({ key: submittedKey, inquiryNo: data.inquiryNo, status: data.status });
      // 문의 저장은 이미 완료되었다. 내역 갱신 실패로 이 결과를 지우지 않는다.
      try { await onSaved?.(); }
      catch { if (mounted.current) setError("문의는 등록되었으나 내역을 갱신하지 못했습니다. 문의 내역 새로고침으로 확인해주세요."); }
    } catch (error) { if (mounted.current) setError(aiErrorMessage(error)); }
    finally { locked.current = false; if (mounted.current) setBusy(""); }
  }

  return <Panel className="p-5">
    <h2 className="font-display font-bold text-slate-900">✨ AI 문의 도우미</h2>
    <p className="mt-1 text-sm text-slate-500">문의 유형을 선택해 질문 초안을 받거나 직접 질문하세요. 본인의 기존 관리자 답변과 승인된 공통 FAQ를 근거로 안내합니다.</p>
    <p className="mt-2 text-xs text-slate-500">일반 안내 질문은 방문 선택 없이 등록할 수 있습니다. 질문 추천이 있어도 답변 근거가 부족하면 센터 응답 대기로 저장됩니다.</p>
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">문의 유형
        <select aria-label="AI 문의 유형" value={categoryNo} onChange={(event) => selectCategory(event.target.value)} disabled={Boolean(busy) || categories.length === 0} className={`mt-1.5 ${field}`}>
          {categories.length === 0 && <option value="">{categoriesLoading ? "문의 유형을 불러오는 중입니다" : "조회된 문의 유형이 없습니다"}</option>}
          {categories.map((category) => <option key={category.inquiryCategoryNo} value={category.inquiryCategoryNo}>{category.inquiryCategoryName}</option>)}
        </select>
      </label>
      <button type="button" onClick={loadDrafts} disabled={!categoryNo || Boolean(busy)} className="rounded-lg border border-teal-200 px-4 py-2.5 text-sm font-bold text-teal-700 disabled:opacity-50">{busy === "drafts" ? "질문 생성 중..." : "질문 초안 받기"}</button>
    </div>
    {!busy && drafts.length === 0 && <p className="mt-2 text-xs text-slate-500">질문을 직접 입력하거나 질문 초안 받기를 눌러주세요. 초안 조회만으로는 문의가 등록되지 않습니다.</p>}
    {busy === "drafts" && <p role="status" className="mt-2 text-xs text-slate-500">선택한 문의 유형의 질문을 생성하는 중입니다...</p>}
    {drafts.length > 0 && <div className="mt-3 flex flex-wrap gap-2" aria-label="AI 질문 초안">{drafts.map((draft) =>
      <button type="button" key={draft} onClick={() => { setQuestion(draft); setResult(null); }} disabled={Boolean(busy)} className="min-h-11 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-left text-sm text-teal-800">{draft}</button>)}</div>}
    <label className="mt-4 block text-xs font-semibold text-slate-600">질문
      <textarea aria-label="AI 문의 내용" rows={3} maxLength={1000} value={question} onChange={(event) => { setQuestion(event.target.value); setResult(null); }} disabled={Boolean(busy)} placeholder="예: 방문 기록은 어디에서 확인할 수 있나요?" className={`mt-1.5 ${field}`} />
    </label>
    <p className="mt-1 text-xs text-slate-500">{question.length}/1,000자 · {requestNo == null ? "방문 연결 없음" : `선택한 본인 방문 요청 #${requestNo}와 연결`}</p>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-500">질문은 문의 내역에 저장됩니다. AI가 답변하면 응답 완료, 센터 확인이 필요하면 응답 대기로 등록됩니다.</p>
      <button type="button" onClick={answer} disabled={!categoryNo || !question.trim() || Boolean(busy) || alreadySaved} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === "answer" ? "답변 확인 중..." : "AI 답변 받기 · 문의 등록"}</button>
    </div>
    {alreadySaved && <p className="mt-3 text-xs font-semibold text-teal-700">이미 등록된 문의 #{submitted.inquiryNo} · {submitted.status}. 같은 질문을 다시 보내지 않고 기존 문의 내역에서 확인해주세요.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {result && <div role="status" className={`mt-4 rounded-lg border p-4 ${result.needsStaff ? "border-amber-200 bg-amber-50" : "border-teal-200 bg-teal-50"}`}>
      <p className="text-xs font-bold text-slate-600">문의 #{result.inquiryNo} · {result.status}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{result.answer}</p>
      {result.needsStaff && <p className="mt-2 text-xs text-slate-600">센터 확인을 기다리는 문의로 저장되었습니다. 같은 질문을 기존 문의 작성으로 다시 등록하지 마세요. AI 답변은 일정이나 담당자를 변경하지 않습니다.</p>}
    </div>}
    {categoryNo === "1" && <div className="mt-3 text-xs text-slate-600"><p>실제 방문 일정 변경에는 기존 희망 날짜·시간 입력이 필요합니다. AI 문의로 일정이 변경되지는 않습니다.</p>
      {onScheduleGuide && <button type="button" onClick={onScheduleGuide} disabled={Boolean(busy)} className="mt-2 rounded-lg border border-teal-200 px-3 py-2.5 font-bold text-teal-700">희망 날짜·시간 입력 위치 보기</button>}</div>}
  </Panel>;
}
