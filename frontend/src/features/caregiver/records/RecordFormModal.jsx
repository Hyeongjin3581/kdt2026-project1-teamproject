import { useEffect, useRef, useState } from "react";

export default function RecordFormModal({ item, onClose, onSave }) {
  const initial = { visitDate: item?.visitDate ?? "", recipientName: item?.recipientName ?? "", content: item?.content ?? "", notes: item?.notes ?? "", status: item?.status ?? "" };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const submitting = useRef(false);
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const dirty = Object.keys(initial).some((key) => form[key] !== initial[key]);
  const canSave = typeof onSave === "function";
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })); setMessage(""); };
  const close = () => { if (submitting.current) return; if (dirty) setConfirmClose(true); else onClose(); };

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key !== "Escape" || submitting.current) return; if (confirmClose) setConfirmClose(false); else close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dirty, confirmClose, onClose]);

  const validate = () => {
    const next = {};
    if (!form.visitDate) next.visitDate = "방문일을 선택해주세요.";
    if (!form.recipientName.trim()) next.recipientName = "수급자 이름을 입력해주세요.";
    if (!form.content.trim()) next.content = "제공한 업무 내용을 입력해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const checkInputs = () => {
    setMessage("");
    if (validate()) setMessage(canSave ? "필수 입력을 확인했습니다. 저장 버튼으로 기록을 저장해주세요." : "필수 입력을 확인했습니다. 서버 API 연결 전에는 저장할 수 없습니다.");
  };

  const save = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    setMessage("");
    if (!validate()) return;
    if (!canSave) { setMessage("서버 업무 기록 API 연결 전에는 저장할 수 없습니다."); return; }
    submitting.current = true;
    setSaving(true);
    try {
      const saved = await onSave({ visitDate: form.visitDate, recipientName: form.recipientName.trim(), content: form.content.trim(), notes: form.notes.trim(), status: form.status.trim() }, item?.recordNo);
      if (saved !== true) setMessage("업무 기록을 저장하지 못했습니다. 입력 내용을 확인한 뒤 다시 시도해주세요.");
    } catch {
      setMessage("업무 기록 저장 중 오류가 발생했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해주세요.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={close}>
      <div role="dialog" aria-modal="true" aria-labelledby="record-form-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white text-slate-700 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h2 id="record-form-title" className="font-display text-lg font-bold text-slate-900">{confirmClose ? "작성 내용 버리기" : item ? "업무 기록 상세 / 수정" : "업무 기록 작성"}</h2><button type="button" aria-label="닫기" onClick={confirmClose ? () => setConfirmClose(false) : close} disabled={saving} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100 disabled:opacity-40">×</button></div>
        {confirmClose ? <div className="px-6 py-5"><p className="text-sm leading-6 text-slate-600">저장하지 않은 입력 내용이 있습니다. 내용을 버리고 닫으시겠습니까?</p><div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" autoFocus onClick={() => setConfirmClose(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">계속 작성</button><button type="button" onClick={onClose} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700">내용 버리고 닫기</button></div></div> : (
          <form onSubmit={save} noValidate>
            <fieldset disabled={saving} className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <p className="text-xs leading-5 text-slate-500 sm:col-span-2">* 표시는 필수 입력입니다. 작성 중인 내용은 저장 전까지 서버에 반영되지 않습니다.</p>
              <label className="block text-xs font-semibold text-slate-600">방문일 *<input autoFocus type="date" required value={form.visitDate} onChange={(event) => update("visitDate", event.target.value)} aria-invalid={Boolean(errors.visitDate)} aria-describedby={errors.visitDate ? "record-date-error" : undefined} className={field} />{errors.visitDate && <span id="record-date-error" className="mt-1 block text-rose-600">{errors.visitDate}</span>}</label>
              <label className="block text-xs font-semibold text-slate-600">수급자 *<input required value={form.recipientName} onChange={(event) => update("recipientName", event.target.value)} placeholder="방문한 수급자 이름" aria-invalid={Boolean(errors.recipientName)} aria-describedby={errors.recipientName ? "record-recipient-error" : undefined} className={field} />{errors.recipientName && <span id="record-recipient-error" className="mt-1 block text-rose-600">{errors.recipientName}</span>}</label>
              <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">업무 내용 *<textarea required rows={5} value={form.content} onChange={(event) => update("content", event.target.value)} placeholder="방문 중 제공한 업무 내용을 작성해주세요." aria-invalid={Boolean(errors.content)} aria-describedby={errors.content ? "record-content-error" : undefined} className={`${field} resize-y`} />{errors.content && <span id="record-content-error" className="mt-1 block text-rose-600">{errors.content}</span>}</label>
              <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">특이사항<textarea rows={3} value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="상태 변화나 전달할 사항이 있으면 작성해주세요." className={`${field} resize-y`} /></label>
              <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">작성 상태 (선택)<input value={form.status} onChange={(event) => update("status", event.target.value)} placeholder="센터에서 안내한 작성 상태" className={field} /><span className="mt-1 block font-normal leading-5 text-slate-400">정해진 상태가 없다면 비워두세요.</span></label>
            </fieldset>
            {!canSave && <p className="mx-6 mb-4 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">서버 업무 기록 API가 아직 연결되지 않아 저장할 수 없습니다. 입력 내용은 이 창을 닫으면 사라집니다.</p>}
            {Object.values(errors).some(Boolean) && <p role="alert" className="px-6 pb-4 text-xs font-semibold text-rose-600">필수 입력 항목을 확인해주세요.</p>}
            {message && <p role="status" className="px-6 pb-4 text-xs font-semibold leading-5 text-slate-700">{message}</p>}
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={close} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-40">닫기</button><button type="button" onClick={checkInputs} disabled={saving} className="rounded-lg border border-teal-200 px-4 py-2.5 text-sm font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-40">입력 확인</button><button type="submit" disabled={!canSave || saving} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? "저장 중..." : canSave ? "저장" : "저장 (API 연결 대기)"}</button></div>
          </form>
        )}
      </div>
    </div>
  );
}
