import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import AiFaq from "./AiFaq";
import { aiErrorMessage, invalidAiResponse } from "../../../utils/aiError";

export default function AiInquiryAssistant({ requestNo, onSaved, onScheduleGuide }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [conflict, setConflict] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);
  const questionInput = useRef(null);
  const consultationRequest = useRef(null);
  // 응답 유실·전달 실패 후에도 동일한 접수 키로 재시도한다.
  const handoffIntent = useRef(null);
  const currentKey = useRef("");
  const key = JSON.stringify([requestNo == null ? null : String(requestNo), question.trim()]);
  currentKey.current = key;
  const alreadySaved = submitted?.key === key;
  const currentResult = result?.key === key ? result : null;
  const button = "rounded-lg border border-teal-200 px-4 py-2.5 text-sm font-bold text-teal-700 disabled:opacity-50";

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; consultationRequest.current?.abort(); };
  }, []);
  useEffect(() => { setError(""); setConflict(false); }, [requestNo]);

  function changeQuestion(value) {
    setQuestion(value); setResult(null); setSubmitted(null); setError(""); setConflict(false);
    // 의미 있는 내용 변경은 새 접수 의도다. 앞뒤 공백만 바꾸면 키를 유지한다.
    if (value.trim() !== question.trim()) handoffIntent.current = null;
  }
  async function consult() {
    if (locked.current || !question.trim() || alreadySaved) return;
    if (question.trim().length > 1000) { setError("문의 내용은 1,000자 이내로 입력해주세요."); return; }
    locked.current = true; setBusy("consult"); setError(""); setResult(null);
    const requestedKey = key;
    const controller = new AbortController();
    consultationRequest.current = controller;
    try {
      const response = await axios.post("/api/ai/inquiries/consult", {
        question: question.trim(), requestNo: requestNo == null ? null : String(requestNo),
      }, { withCredentials: true, signal: controller.signal });
      const data = response.data;
      if (!data || typeof data.answer !== "string" || !data.answer.trim()
        || !["answered", "staffRequired", "scheduleRequired"].includes(data.resolution)
        || !Array.isArray(data.sourceFaqNos) || !data.sourceFaqNos.every((no) => Number.isInteger(no) && no > 0)) throw invalidAiResponse(response);
      if (mounted.current && !controller.signal.aborted && currentKey.current === requestedKey) setResult({ ...data, key: requestedKey });
    } catch (error) {
      if (mounted.current && !controller.signal.aborted && currentKey.current === requestedKey) setError(aiErrorMessage(error, "consult"));
    } finally { locked.current = false; if (mounted.current) setBusy(""); }
  }
  async function handoff() {
    if (locked.current || currentResult?.resolution !== "staffRequired" || alreadySaved || conflict) return;
    locked.current = true; setBusy("handoff"); setError("");
    const requestedKey = key;
    try {
      if (handoffIntent.current?.key !== requestedKey) handoffIntent.current = { key: requestedKey, requestId: crypto.randomUUID() };
      const response = await axios.post("/api/ai/inquiries/handoff", {
        question: question.trim(), requestNo: requestNo == null ? null : String(requestNo), requestId: handoffIntent.current.requestId,
      }, { withCredentials: true });
      const data = response.data;
      if (!data || !Number.isInteger(data.inquiryNo) || data.inquiryNo <= 0
        || !Number.isInteger(data.inquiryCategoryNo) || data.inquiryCategoryNo <= 0
        || !["응답 대기", "응답 완료"].includes(data.status)) throw invalidAiResponse(response);
      if (!mounted.current) return;
      if (currentKey.current === requestedKey) setSubmitted({ ...data, key: requestedKey });
      // 저장 확인 후에만 내역 갱신. 갱신 실패로 접수 결과를 지우지 않는다.
      try { await onSaved?.(); }
      catch { if (mounted.current && currentKey.current === requestedKey) setError("접수는 완료되었으나 내역을 갱신하지 못했습니다. 문의 내역 새로고침으로 확인해주세요."); }
    } catch (error) {
      if (mounted.current && currentKey.current === requestedKey) {
        setError(aiErrorMessage(error, "handoff"));
        if (error.response?.status === 409) setConflict(true);
      }
    } finally { locked.current = false; if (mounted.current) setBusy(""); }
  }

  return <Panel className="p-5 font-sans">
    <AiFaq embedded onNewInquiry={() => { questionInput.current?.scrollIntoView({ behavior: "smooth", block: "center" }); questionInput.current?.focus({ preventScroll: true }); }} />
    <h3 className="mt-5 text-sm font-bold text-slate-900">AI에게 질문하기</h3>
    <p className="mt-1 text-sm text-slate-500">FAQ와 서비스 안내, AI의 일반 지식을 참고해 답변을 작성합니다.</p>
    <label className="mt-4 block text-sm font-semibold text-slate-700">궁금한 내용을 입력해 주세요
      <textarea ref={questionInput} aria-label="AI 문의 내용" rows={3} maxLength={1000} value={question} onChange={(event) => changeQuestion(event.target.value)} disabled={Boolean(busy)} placeholder="예: 방문 일지는 어디서 볼 수 있나요?" className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500" />
    </label>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-500">{question.length}/1,000자 · 질문만으로 센터에 접수되지 않습니다.</p>
      <button type="button" onClick={consult} disabled={!question.trim() || Boolean(busy) || alreadySaved} aria-live="polite" className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === "consult" ? "AI가 답변을 작성하고 있습니다…" : "AI 답변 받기"}</button>
    </div>
    {requestNo != null && <p className="mt-2 text-xs text-slate-500">선택한 방문 일정과 연결된 질문입니다.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {currentResult && <div role="status" className={`mt-4 rounded-lg border p-4 ${currentResult.resolution === "answered" ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"}`}>
      <p className="text-xs font-bold text-slate-600">{currentResult.resolution === "answered" ? "AI 답변" : currentResult.resolution === "scheduleRequired" ? "일정 변경 요청 안내" : "담당 센터 확인 필요"}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{currentResult.answer}</p>
      {currentResult.resolution === "staffRequired" && !alreadySaved && <>
        <p className="mt-3 text-xs text-slate-600">아직 접수되지 않았습니다. 아래 버튼을 누르면 입력한 질문을 담당 센터에 전달합니다.</p>
        <button type="button" onClick={handoff} disabled={Boolean(busy) || conflict} className={`${button} mt-3`}>{busy === "handoff" ? "전달 중..." : "센터에 문의 전달"}</button>
      </>}
      {currentResult.resolution === "scheduleRequired" && <>
        <p className="mt-3 text-xs text-slate-600">아직 일정이 변경되거나 문의가 접수된 것은 아닙니다. 기존 요청 폼에서 방문 일정과 희망 날짜·시간을 선택해 주세요.</p>
        {onScheduleGuide && <button type="button" onClick={onScheduleGuide} disabled={Boolean(busy)} className={`${button} mt-3`}>일정 변경 요청하기</button>}
      </>}
    </div>}
    {alreadySaved && <p role="status" className="mt-3 text-sm font-semibold text-teal-700">센터에 문의가 접수되었습니다. 문의 #{submitted.inquiryNo} · {submitted.status}. 같은 내용은 다시 접수하지 않고 문의 내역에서 확인해주세요.</p>}
  </Panel>;
}
