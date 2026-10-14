import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import { aiErrorMessage, invalidAiResponse } from "../../../utils/aiError";

export default function AiFaq() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [answer, setAnswer] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const answerRequest = useRef(null);

  async function loadFaqs(signal) {
    answerRequest.current?.abort();
    setSelected(null);
    setAnswer("");
    setAnswerError("");
    setAnswerLoading(false);
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/ai/faq", { withCredentials: true, signal });
      if (!Array.isArray(response.data) || !response.data.every((item) => item && item.faqNo != null && typeof item.question === "string")) throw invalidAiResponse(response);
      if (!signal?.aborted) setFaqs(response.data);
    } catch (error) {
      if (!axios.isCancel(error) && !signal?.aborted) { setFaqs([]); setError(aiErrorMessage(error)); }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    loadFaqs(controller.signal);
    return () => { controller.abort(); answerRequest.current?.abort(); };
  }, []);

  async function loadAnswer(faqNo) {
    answerRequest.current?.abort();
    const controller = new AbortController();
    answerRequest.current = controller;
    setAnswer("");
    setAnswerError("");
    setAnswerLoading(true);
    try {
      const response = await axios.get(`/api/ai/faq/${faqNo}/answer`, { withCredentials: true, signal: controller.signal });
      if (response.data?.faqNo !== faqNo || typeof response.data?.answer !== "string" || !response.data.answer.trim()) throw invalidAiResponse(response);
      if (!controller.signal.aborted) setAnswer(response.data.answer);
    } catch (error) {
      if (!axios.isCancel(error) && !controller.signal.aborted) setAnswerError(aiErrorMessage(error));
    } finally {
      if (!controller.signal.aborted) setAnswerLoading(false);
    }
  }
  function toggle(faqNo) {
    if (selected === faqNo) { answerRequest.current?.abort(); setSelected(null); return; }
    setSelected(faqNo);
    loadAnswer(faqNo);
  }

  return <Panel className="p-5">
    <div className="flex items-start justify-between gap-3"><div><h2 className="font-display font-bold text-slate-900">승인된 공통 FAQ</h2>
      <p className="mt-1 text-sm text-slate-500">자주 묻는 질문을 선택하면 안내 답변을 확인할 수 있습니다.</p>
      <p className="mt-1 text-xs text-teal-700">관리자가 검토하고 승인한 저장된 답변을 안내합니다.</p></div>
      <button type="button" onClick={() => loadFaqs()} disabled={loading} className="shrink-0 rounded-lg border border-teal-200 px-3 py-2.5 text-xs font-bold text-teal-700 disabled:opacity-50">새로고침</button></div>
    {loading ? <p className="mt-4 text-sm text-slate-500" role="status">추천 질문을 불러오는 중입니다...</p>
      : error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>
        : faqs.length === 0 ? <p className="mt-4 text-sm text-slate-500">아직 공개된 공통 질문이 없습니다. 위 AI 문의 도우미나 기존 문의 작성 기능을 이용해 주세요.</p>
          : <div className="mt-4 space-y-2">{faqs.map((faq) => <div key={faq.faqNo} className={`overflow-hidden rounded-lg border ${selected === faq.faqNo ? "border-teal-300 bg-teal-50/40" : "border-slate-200"}`}>
            <h3><button type="button" onClick={() => toggle(faq.faqNo)} aria-expanded={selected === faq.faqNo} aria-controls={`ai-faq-answer-${faq.faqNo}`} id={`ai-faq-question-${faq.faqNo}`} className="flex min-h-12 w-full items-center justify-between gap-3 p-3 text-left text-sm font-semibold text-teal-800"><span>{faq.question}</span><span aria-hidden="true">{selected === faq.faqNo ? "−" : "+"}</span></button></h3>
            <div id={`ai-faq-answer-${faq.faqNo}`} role="region" aria-labelledby={`ai-faq-question-${faq.faqNo}`} hidden={selected !== faq.faqNo} className="border-t border-teal-100 p-4 text-sm">
              {selected === faq.faqNo && <div aria-live="polite">{answerLoading ? <p className="text-slate-500">저장된 답변을 불러오는 중입니다...</p>
                : answerError ? <><p role="alert" className="text-red-600">{answerError}</p><button type="button" onClick={() => loadAnswer(faq.faqNo)} className="mt-3 rounded-lg border border-teal-200 px-3 py-2.5 font-bold text-teal-700">답변 다시 불러오기</button></>
                  : <p className="whitespace-pre-wrap break-words leading-6 text-slate-700">{answer}</p>}</div>}
            </div>
          </div>)}</div>}
  </Panel>;
}
