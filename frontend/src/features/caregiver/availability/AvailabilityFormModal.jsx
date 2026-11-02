import { useEffect, useState } from "react";
import axios from "axios";
import HourSelect from "../../../components/common/HourSelect";
import { availabilityStatuses, defaultAvailabilityStatus, MIN_HOUR, MAX_HOUR } from "./availabilityTime";
import { toHhmm, toServerTime } from "../../../utils/timeFormat";

// 가용시간 등록·수정 창 : 등록 POST / 수정 PUT /api/caregiver-availability (body : CaregiverAvailabilityDto)
export default function AvailabilityFormModal({ item, careworkerNo, onClose, onSaved }) {
  const isEdit = Boolean(item);
  const [form, setForm] = useState({
    availableDate: item?.availableDate ?? "",
    start: item ? toHhmm(item.startTime) : "09:00",
    end: item ? toHhmm(item.endTime) : "18:00",
    status: item?.status ?? defaultAvailabilityStatus,
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setMessage(""); };

  // Esc 로 닫기
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    const startTime = toServerTime(form.start);
    const endTime = toServerTime(form.end);
    if (!form.availableDate) { setMessage("날짜를 선택해주세요."); return; }
    if (startTime >= endTime) { setMessage("종료 시간은 시작 시간보다 늦어야 합니다."); return; }
    setSaving(true);
    try {
      const body = { caregiverNo: careworkerNo, availableDate: form.availableDate, startTime, endTime, status: form.status };
      const response = isEdit
        ? await axios.put("http://localhost:8080/api/caregiver-availability", { ...body, availabilityNo: item.availabilityNo }, { withCredentials: true })
        : await axios.post("http://localhost:8080/api/caregiver-availability", body, { withCredentials: true });
      if (response.data) await onSaved(isEdit ? "가용시간을 수정했습니다." : "가용시간을 등록했습니다.");
      else setMessage("저장하지 못했습니다. 입력 정보를 확인해주세요.");
    } catch (error) {
      console.error(error);
      setMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => { if (!saving) onClose(); }}>
      <div role="dialog" aria-modal="true" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white text-slate-700 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h2 className="font-display text-lg font-bold text-slate-900">{isEdit ? "가용시간 수정" : "가용시간 등록"}</h2><button type="button" aria-label="닫기" onClick={onClose} disabled={saving} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100">×</button></div>
        <form onSubmit={save}>
          <fieldset disabled={saving} className="grid gap-3 px-6 py-5 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">근무 가능한 날짜<input autoFocus type="date" value={form.availableDate} onChange={(event) => update("availableDate", event.target.value)} className={field} /></label>
            <label className="block text-xs font-semibold text-slate-600">시작 시간<HourSelect minHour={MIN_HOUR} maxHour={MAX_HOUR - 1} value={form.start} onChange={(event) => update("start", event.target.value)} className={field} /></label>
            <label className="block text-xs font-semibold text-slate-600">종료 시간<HourSelect minHour={MIN_HOUR + 1} maxHour={MAX_HOUR} value={form.end} onChange={(event) => update("end", event.target.value)} className={field} /></label>
            <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">상태<select value={form.status} onChange={(event) => update("status", event.target.value)} className={field}>{availabilityStatuses.map((s) => <option key={s}>{s}</option>)}</select></label>
            <p className="text-xs leading-5 text-slate-500 sm:col-span-2">오전 6시부터 밤 10시 사이만 등록할 수 있습니다. '근무가능'으로 등록한 시간만 방문 배정에 사용됩니다.</p>
          </fieldset>
          {message && <p role="alert" className="px-6 pb-4 text-xs font-semibold text-rose-600">{message}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50">취소</button><button type="submit" disabled={saving} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button></div>
        </form>
      </div>
    </div>
  );
}
