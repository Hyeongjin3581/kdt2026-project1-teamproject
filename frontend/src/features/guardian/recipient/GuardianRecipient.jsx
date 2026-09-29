import { useState } from "react";
import Panel from "../../../components/common/Panel";
import { TODAY } from "../../../constants";

export default function GuardianRecipient({ onComplete, onCancel }) {
  const [form, setForm] = useState({ name: "", age: "", address: "", gender: "", significant: "" });
  const [message, setMessage] = useState("");
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    if (!form.name.trim() || !form.age || !form.address.trim() || !form.gender) {
      setMessage("성함, 나이, 주소, 성별을 입력해주세요.");
      return;
    }
    onComplete({ ...form, name: form.name.trim(), address: form.address.trim() });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">돌봄 어르신 등록</h1>
        <p className="mt-1 text-sm text-slate-500">돌봄이 필요한 어르신의 기본 정보를 등록해주세요.</p>
      </div>

      <Panel className="p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/70 p-4 text-sm text-teal-800">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white">i</span>
          <p className="leading-5">수급자번호와 사용자번호는 등록 시 서버에서 자동으로 연결됩니다. 요양 등급과 담당 요양보호사는 센터 상담 후 안내됩니다.</p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">수급자 성명 <span className="text-teal-600">*</span><input value={form.name} onChange={(event) => update("name", event.target.value)} className={field} placeholder="수급자 성명 입력" /></label>
          <label className="text-xs font-semibold text-slate-600">수급자 나이 <span className="text-teal-600">*</span><input type="number" min="0" max="130" value={form.age} onChange={(event) => update("age", event.target.value)} className={field} placeholder="나이 입력" /></label>
          <label className="text-xs font-semibold text-slate-600">수급자 성별 <span className="text-teal-600">*</span><select value={form.gender} onChange={(event) => update("gender", event.target.value)} className={field}><option value="">선택해주세요</option><option value="female">여성</option><option value="male">남성</option></select></label>
          <label className="text-xs font-semibold text-slate-600">수급자 거주지역(주소) <span className="text-teal-600">*</span><input value={form.address} onChange={(event) => update("address", event.target.value)} className={field} placeholder="주소 입력" /></label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">특이사항<textarea value={form.significant} onChange={(event) => update("significant", event.target.value)} rows={4} className={`${field} resize-none`} placeholder="건강 상태나 상담 시 참고할 내용을 입력해주세요." /></label>
        </div>
        {message && <p className="mt-4 text-xs font-semibold text-rose-600">{message}</p>}
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">취소</button>
          <button type="button" onClick={submit} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">등록 완료</button>
        </div>
      </Panel>
    </div>
  );
}
