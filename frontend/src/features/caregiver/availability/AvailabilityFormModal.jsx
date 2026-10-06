import { useEffect, useRef, useState } from "react";
import caregiverApi from "../caregiverApi";
import availabilityTime, { defaultAvailabilityStatus, formatUiTime, isUiTimeRange } from "./availabilityTime";

export default function AvailabilityFormModal({ item, selection, careworkerNo, onClose, onSaved, api = caregiverApi, timeAdapter = availabilityTime }) {
  const isEdit = Boolean(item);
  const hasSelection = !isEdit && selection && isUiTimeRange(selection.startMinutes, selection.endMinutes);
  const convertedStart = hasSelection ? timeAdapter.uiTimeToBackendValue(selection.startMinutes) : null;
  const convertedEnd = hasSelection ? timeAdapter.uiTimeToBackendValue(selection.endMinutes) : null;
  const canConvert = Number.isInteger(convertedStart) && Number.isInteger(convertedEnd) && convertedStart >= 0 && convertedEnd <= 2147483647 && convertedStart < convertedEnd;
  const [form, setForm] = useState({ availableDate: item?.availableDate ?? selection?.availableDate ?? "", startTime: String(item?.startTime ?? (canConvert ? convertedStart : "")), endTime: String(item?.endTime ?? (canConvert ? convertedEnd : "")), status: item?.status ?? defaultAvailabilityStatus });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === "Escape" && !submitting.current) onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const save = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    if (api.isDemo && !api.demoAvailability) { setMessage("체험 세션을 다시 로그인해주세요."); return; }
    setMessage("");
    const startTime = Number(form.startTime);
    const endTime = Number(form.endTime);
    if (!form.availableDate || form.startTime.trim() === "" || form.endTime.trim() === "" || !form.status.trim()) {
      setMessage("날짜, 시작시간, 종료시간, 상태를 모두 입력해주세요.");
      return;
    }
    if (!Number.isInteger(startTime) || !Number.isInteger(endTime) || startTime < 0 || endTime > 24 || startTime >= endTime) {
      setMessage("시간은 0~24의 정수로 입력하고 종료시간을 시작시간보다 크게 입력해주세요.");
      return;
    }
    if (!Number.isInteger(careworkerNo) || careworkerNo < 1 || (item && item.caregiverNo !== careworkerNo)) {
      setMessage("로그인한 요양보호사의 가용시간만 수정할 수 있습니다.");
      return;
    }
    const body = { availableDate: form.availableDate, startTime, endTime, status: form.status.trim(), caregiverNo: careworkerNo };
    submitting.current = true;
    setSaving(true);
    try {
      if (api.isDemo) {
        if (isEdit) api.demoAvailability.update({ ...body, availabilityNo: item.availabilityNo });
        else api.demoAvailability.create(body);
      } else {
        const response = isEdit
          ? await api.updateAvailability({ ...body, availabilityNo: item.availabilityNo })
          : await api.createAvailability(body);
        if (response.data !== true) { setMessage("저장하지 못했습니다. 입력 정보와 요양보호사 연결 정보를 확인해주세요."); return; }
      }
      await onSaved(api.isDemo ? "체험 가용시간에 반영했습니다. 실제 DB에는 저장하지 않았습니다." : isEdit ? "가용시간을 수정했습니다." : "가용시간을 등록했습니다.");
    } catch (error) {
      setMessage(error.response ? `가용시간 저장 실패 (HTTP ${error.response.status})` : "백엔드에 연결할 수 없습니다. 서버 실행 상태를 확인해주세요.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => { if (!saving) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="availability-form-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white text-slate-700 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h2 id="availability-form-title" className="font-display text-lg font-bold text-slate-900">{isEdit ? "가용시간 수정" : "가용시간 등록"}</h2><button type="button" aria-label="닫기" onClick={onClose} disabled={saving} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed">×</button></div>
        <form onSubmit={save}>
          <fieldset disabled={saving} className="grid gap-3 px-6 py-5 sm:grid-cols-2">
            {hasSelection && <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs leading-5 text-teal-900 sm:col-span-2"><p className="font-bold">시간표 선택: {selection.availableDate} · {formatUiTime(selection.startMinutes)} ~ {formatUiTime(selection.endMinutes)}</p><p>{canConvert ? "선택한 시간을 저장값으로 채웠습니다. 내용을 확인한 뒤 저장해주세요." : "시각을 저장 정수값으로 바꾸는 규칙이 미정입니다. 선택값은 아직 저장되지 않았으며, 저장하려면 아래에 기존 방식의 정수값을 직접 입력해주세요."}</p></div>}
            <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">근무 가능한 날짜<input autoFocus type="date" required value={form.availableDate} onChange={(event) => update("availableDate", event.target.value)} className={field} /></label>
            <label className="block text-xs font-semibold text-slate-600">시작시간 (시)<input type="number" required min="0" max="23" step="1" value={form.startTime} onChange={(event) => update("startTime", event.target.value)} className={field} /></label>
            <label className="block text-xs font-semibold text-slate-600">종료시간 (시)<input type="number" required min="1" max="24" step="1" value={form.endTime} onChange={(event) => update("endTime", event.target.value)} className={field} /></label>
            <p className="text-xs leading-5 text-slate-500 sm:col-span-2">예: 09:00~11:00은 시작 9, 종료 11로 입력합니다. 하루의 끝은 24입니다.</p>
            <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">상태<input required maxLength={20} value={form.status} onChange={(event) => update("status", event.target.value)} placeholder="센터에서 사용하는 상태 입력" className={field} /></label>
          </fieldset>
          {message && <p role="alert" className="px-6 pb-4 text-xs font-semibold text-rose-600">{message}</p>}
          {api.isDemo && <p className="px-6 pb-4 text-xs text-amber-800">체험 중에만 반영되며 실제 DB에는 저장하지 않습니다.</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50">취소</button><button type="submit" disabled={saving || (api.isDemo && !api.demoAvailability)} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "반영 중..." : api.isDemo ? "체험에 반영" : "저장"}</button></div>
        </form>
      </div>
    </div>
  );
}
