import { useState } from "react";
import axios from "axios";
import AddressField from "./AddressField";

// 수급자 정보 수정·삭제 모달 : PUT /carerecipient, DELETE /carerecipient (body 에 { careRecipientNo })
// 현재 API는 /api/수급자/{번호} 경로와 underscore 필드명을 사용합니다.
// recipient : 백엔드 수급자 DTO 그대로 (careRecipientNo, guardianNo, careRecipientName ...)
export default function RecipientEditModal({ recipient, onClose, onChanged }) {
    const [form, setForm] = useState({
        name: recipient.careRecipientName ?? "",
        age: String(recipient.careRecipientAge ?? ""),
        gender: recipient.careRecipientGender ?? "여자",
        address: recipient.careRecipientAddress ?? "",
        content: recipient.careRecipientContent ?? "",
    });
    const [message, setMessage] = useState("성별 코드 기준이 정해지기 전까지 기존 성별 값을 유지합니다.");
    const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
    const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const save = async () => {
        if (!form.name.trim() || !form.age || !form.address.trim()) {
            setMessage("성함, 나이, 주소를 입력해주세요.");
            return;
        }
        try {
            const response = await axios.put(
                `/api/수급자/${recipient.careRecipientNo}`,
                {
                    carerecipient_no: recipient.careRecipientNo,
                    guardian_no: recipient.guardianNo,
                    carerecipient_name: form.name.trim(),
                    carerecipient_age: Number(form.age),
                    carerecipient_gender: recipient.carerecipient_gender,
                    carerecipient_address: form.address.trim(),
                    careRecipient_content: form.content,
                },
                { withCredentials: true }
            );
            if (response.data) onChanged();
            else setMessage("수정에 실패했습니다. 입력 정보를 확인해주세요.");
        } catch (error) {
            console.error(error);
            setMessage("서버 통신 오류가 발생했습니다.");
        }
    };

    const remove = async () => {
        if (!window.confirm(`${recipient.careRecipientName} 어르신을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
        try {
            const response = await axios.delete(`/api/수급자/${recipient.careRecipientNo}`, {
                withCredentials: true,
            });
            if (response.data) onChanged();
            else setMessage("삭제에 실패했습니다.");
        } catch (error) {
            console.error(error);
            setMessage("삭제할 수 없습니다. 연결된 방문 요청이 있으면 먼저 정리해야 합니다.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-display text-lg font-bold text-slate-900">수급자 정보 수정</h2>
                    <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
                </div>
                <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-slate-600">수급자 성명<input value={form.name} onChange={(e) => update("name", e.target.value)} className={field} /></label>
                    <label className="block text-xs font-semibold text-slate-600">나이<input type="number" min="0" max="130" value={form.age} onChange={(e) => update("age", e.target.value)} className={field} /></label>
                    <label className="block text-xs font-semibold text-slate-600">성별
                        <select disabled value={form.gender} onChange={(e) => update("gender", e.target.value)} className={field}><option>미확인</option><option>여자</option><option>남자</option></select>
                    </label>
                    <AddressField label="거주지역(주소)" value={form.address} onChange={(v) => update("address", v)} />
                    <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">특이사항<textarea rows={3} value={form.content} onChange={(e) => update("content", e.target.value)} className={`${field} resize-none`} /></label>
                    {message && <p className="text-xs font-semibold text-rose-600 sm:col-span-2">{message}</p>}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                    <button onClick={remove} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100">삭제</button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">취소</button>
                        <button onClick={save} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
