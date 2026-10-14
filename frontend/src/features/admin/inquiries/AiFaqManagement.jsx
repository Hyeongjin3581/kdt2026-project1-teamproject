import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { aiErrorMessage, invalidAiResponse } from "../../../utils/aiError";

const button = "rounded-lg border border-teal-200 px-4 py-2.5 text-sm font-bold text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50";
const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50";
const validFaq = (faq) => faq && faq.faqNo != null && faq.sourceInquiryNo != null
  && typeof faq.question === "string" && typeof faq.answer === "string" && typeof faq.approved === "boolean";

export default function AiFaqManagement({ inquiries }) {
  const [faqs, setFaqs] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [inquiryNo, setInquiryNo] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const locked = useRef(false);
  const answered = inquiries.filter((item) => item.answerContent?.trim() && item.inquiryContent?.trim());

  async function loadFaqs(signal) {
    setLoading(true);
    setReady(false);
    setError("");
    try {
      const response = await axios.get("/api/ai/faq/admin", { withCredentials: true, signal });
      if (!Array.isArray(response.data) || !response.data.every(validFaq)) throw invalidAiResponse(response);
      if (signal?.aborted) return;
      setFaqs(response.data);
      const nextDrafts = {};
      response.data.forEach((faq) => { nextDrafts[faq.faqNo] = { question: faq.question, answer: faq.answer }; });
      setDrafts(nextDrafts);
      setReady(true);
    } catch (error) {
      if (!axios.isCancel(error) && !signal?.aborted) setError(aiErrorMessage(error));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    loadFaqs(controller.signal);
    return () => controller.abort();
  }, []);

  // 생성·저장·승인 중 중복 요청을 막고, 서버 결과를 확인한 뒤 목록을 갱신한다.
  async function perform(action, request, successMessage, validate = (data) => data === true) {
    if (locked.current) return;
    locked.current = true;
    setBusy(action);
    setError("");
    setMessage("");
    try {
      const response = await request();
      if (response.data === false) { setError("서버에서 처리하지 못했습니다. 변경 결과를 확인해주세요."); return; }
      if (!validate(response.data)) throw invalidAiResponse(response);
      setMessage(successMessage);
      await loadFaqs();
    } catch (error) {
      setError(aiErrorMessage(error));
    } finally {
      locked.current = false;
      setBusy("");
    }
  }

  function generate() {
    if (!inquiryNo || !answered.some((item) => String(item.inquiryNo) === inquiryNo)) return;
    const existing = faqs.find((faq) => String(faq.sourceInquiryNo) === inquiryNo);
    if (existing && !window.confirm("이 문의로 생성한 FAQ가 있습니다. 다시 생성하면 기존 질문·답변이 갱신되고 승인이 해제됩니다. 재생성할까요?")) return;
    if (!existing && !window.confirm("선택한 문의의 관리자 답변으로 FAQ 초안을 생성할까요? 생성 후 개인정보와 개별 일정·승인 결과를 검토해주세요.")) return;
    perform("generate", () => axios.post("/api/ai/faq/generate", {}, { params: { inquiryNo: Number(inquiryNo) }, withCredentials: true }),
      "FAQ 초안을 생성했습니다. 질문·답변을 검토한 뒤 승인해주세요.", (data) => validFaq(data) && data.approved === false && String(data.sourceInquiryNo) === inquiryNo);
  }
  function save(faq) {
    const draft = drafts[faq.faqNo];
    if (!draft.question.trim() || !draft.answer.trim()) { setError("질문과 답변을 모두 입력해주세요."); return; }
    if (draft.question.length > 500 || draft.answer.length > 1000) { setError("질문은 500자, 답변은 1,000자 이내로 입력해주세요."); return; }
    perform(`save-${faq.faqNo}`, () => axios.put(`/api/ai/faq/${faq.faqNo}`, { question: draft.question, answer: draft.answer }, { withCredentials: true }),
      "수정했습니다. 승인이 해제되었으므로 내용을 검토한 뒤 다시 승인해주세요.");
  }
  function approve(faq) {
    if (!faq.approved && !window.confirm("질문·답변에 개인정보, 개인 일정, 개별 승인 결과가 없는지 확인하셨나요? 승인하면 보호자에게 공개됩니다.")) return;
    perform(`approve-${faq.faqNo}`, () => axios.put(`/api/ai/faq/${faq.faqNo}/approve`, {}, { params: { approved: !faq.approved }, withCredentials: true }),
      faq.approved ? "승인을 해제했습니다. 보호자 FAQ 목록에서 제외됩니다." : "FAQ를 승인했습니다. 보호자 FAQ 목록에 공개됩니다.");
  }
  function updateDraft(faqNo, key, value) {
    setDrafts((current) => ({ ...current, [faqNo]: { ...current[faqNo], [key]: value } }));
  }

  const disabled = loading || Boolean(busy) || !ready;
  return <Panel className="p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display font-bold text-slate-900">✨ AI FAQ 관리</h2>
      <p className="mt-1 text-sm text-slate-500">답변 완료된 문의에서 대표 질문을 생성하고, 기존 관리자 답변을 검토해 공개합니다.</p>
      <p className="mt-2 text-xs font-semibold text-amber-700">개인정보·개인 일정·특정 보호자의 승인 결과를 삭제한 뒤 승인해주세요. 초안 생성과 수정 후에는 다시 승인이 필요합니다.</p></div>
      <button type="button" onClick={() => { setMessage(""); loadFaqs(); }} disabled={loading || Boolean(busy)} className={button}>FAQ 목록 새로고침</button></div>
    <div className="mt-4 flex flex-wrap items-end gap-2">
      <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">답변이 등록된 문의
        <select value={inquiryNo} onChange={(event) => setInquiryNo(event.target.value)} disabled={disabled} className={field}>
          <option value="">문의를 선택해주세요</option>{answered.map((item) => <option key={item.inquiryNo} value={item.inquiryNo}>#{item.inquiryNo} · {item.inquiryContent}</option>)}
        </select></label>
      <button type="button" onClick={generate} disabled={disabled || !inquiryNo || !answered.some((item) => String(item.inquiryNo) === inquiryNo)} className={button}>{busy === "generate" ? "초안 생성 중..." : "FAQ 초안 생성"}</button>
    </div>
    {answered.length === 0 && <p className="mt-2 text-xs text-slate-500">문의 내용과 관리자 답변이 모두 등록된 문의만 FAQ를 생성할 수 있습니다.</p>}
    <div aria-live="polite">{loading && <p className="mt-4 text-sm text-slate-500">FAQ 목록을 불러오는 중입니다...</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error} FAQ 목록 새로고침 후 다시 시도해주세요.</p>}
      {message && <p className="mt-4 text-sm text-teal-700">{message}</p>}</div>
    {!loading && !error && faqs.length === 0 && <p className="mt-4 text-sm text-slate-500">생성된 FAQ가 없습니다.</p>}
    <div className="mt-4 space-y-4">{faqs.map((faq) => {
      const draft = drafts[faq.faqNo];
      const changed = draft.question !== faq.question || draft.answer !== faq.answer;
      return <div key={faq.faqNo} className="rounded-lg border border-slate-200 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2"><b className="text-sm text-slate-800">FAQ #{faq.faqNo}</b><span className="text-xs text-slate-500">원본 문의 #{faq.sourceInquiryNo}</span><Badge tone={faq.approved ? "ok" : "warning"}>{faq.approved ? "승인됨" : "미승인"}</Badge></div>
        <label className="block text-xs font-semibold text-slate-600">질문<textarea rows={2} value={draft.question} onChange={(event) => updateDraft(faq.faqNo, "question", event.target.value)} disabled={disabled} className={field} /></label>
        <label className="mt-3 block text-xs font-semibold text-slate-600">답변<textarea rows={4} value={draft.answer} onChange={(event) => updateDraft(faq.faqNo, "answer", event.target.value)} disabled={disabled} className={field} /></label>
        {changed && <p className="mt-2 text-xs text-amber-700">저장하지 않은 변경이 있습니다. 저장하면 승인이 해제됩니다.</p>}
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => save(faq)} disabled={disabled || !changed} className={button}>{busy === `save-${faq.faqNo}` ? "저장 중..." : "질문·답변 저장"}</button>
          <button type="button" onClick={() => approve(faq)} disabled={disabled || (!faq.approved && changed)} className={button}>{busy === `approve-${faq.faqNo}` ? "처리 중..." : faq.approved ? "승인 해제" : "FAQ 승인"}</button></div>
      </div>;
    })}</div>
  </Panel>;
}
