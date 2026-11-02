//
import { useEffect, useState } from "react";
import axios from "axios";
import AddressField from "../../../components/common/AddressField";

// 요양보호사 수정 모달 : PUT /api/careworkers
// 요양보호사는 회원가입 → 관리자 승인으로 들어오므로, 관리자 화면에서 새로 등록하는 기능은 없다.
// careworker : 수정할 요양보호사의 백엔드 DTO
export default function CaregiverFormModal({ careworker, onClose, onSaved }) {
    const [centers, setCenters] = useState([]);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [detailKey, setDetailKey] = useState(0); // 개별조회로 값을 채운 뒤 AddressField 를 새로 그리기 위한 키
    const [form, setForm] = useState({
        name: careworker.careworkerName ?? "",
        gender: careworker.careworkerGender ?? "여자",
        age: String(careworker.careworkerAge ?? ""),
        hourWage: String(careworker.hourWage ?? ""),
        address: careworker.careworkerAddress ?? "",
        state: careworker.careworkerState ?? "근무중",
        centerNo: careworker.centerNo ?? "",
    });
    const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
    const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    // 소속 센터 목록과, 수정할 요양보호사의 최신 값을 axios로 조회
    useEffect(() => {
        async function loadOptions() {
            try {
                const [centersRes, detailRes] = await Promise.all([
                    axios.get("http://localhost:8080/center", { withCredentials: true }),
                    // 개별조회로 최신 값을 다시 받아서 채운다 : GET /api/careworkers/detail?careworkerNo=번호
                    axios.get("http://localhost:8080/api/careworkers/detail", { params: { careworkerNo: careworker.careworkerNo }, withCredentials: true }),
                ]);
                const detail = detailRes.data;
                if (detail) {
                    setForm({
                        name: detail.careworkerName ?? "",
                        gender: detail.careworkerGender ?? "여자",
                        age: String(detail.careworkerAge ?? ""),
                        hourWage: String(detail.hourWage ?? ""),
                        address: detail.careworkerAddress ?? "",
                        state: detail.careworkerState ?? "근무중",
                        centerNo: detail.centerNo ?? "",
                    });
                    setDetailKey((k) => k + 1); // 주소 입력칸이 최신 값으로 다시 그려지도록
                }
                setCenters(centersRes.data);
            } catch (error) {
                console.error("선택 목록 조회 실패:", error);
                setMessage("센터 목록을 불러오지 못해 현재 연결 값을 유지합니다. 기존 정보는 수정할 수 있습니다.");
            }
        }
        loadOptions();
    }, []);

    const save = async () => {
        if (saving) return;
        if (!form.name.trim() || !form.age || !form.hourWage || !form.address.trim() || !form.centerNo) {
            setMessage("모든 항목을 입력해주세요.");
            return;
        }
        setSaving(true);
        setMessage("");
        try {
            // 서버는 요양보호사 DTO 전체를 받으므로, 바꾸지 않는 값(연결 계정 등)은 그대로 다시 보낸다
            const body = {
                careworkerNo: careworker.careworkerNo,
                careworkerName: form.name.trim(),
                careworkerGender: form.gender,
                careworkerAge: Number(form.age),
                hourWage: Number(form.hourWage),
                careworkerAddress: form.address.trim(),
                careworkerState: form.state,
                centerNo: Number(form.centerNo),
                userNo: careworker.userNo,
            };
            // axios.put("통신할주소", { body }, { 옵션 }) → 컨트롤러가 boolean 을 반환
            const response = await axios.put("http://localhost:8080/api/careworkers", body, { withCredentials: true });
            if (response.data) { onSaved(); return; }
            setMessage("저장에 실패했습니다. 입력 정보를 확인해주세요.");
        } catch (error) {
            console.error(error);
            setMessage("저장에 실패했습니다. 입력 정보를 확인해주세요.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-display text-lg font-bold text-slate-900">요양보호사 수정</h2>
                    <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
                </div>
                <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-slate-600">성명<input value={form.name} onChange={(e) => update("name", e.target.value)} className={field} placeholder="예: 정미숙" /></label>
                    <label className="block text-xs font-semibold text-slate-600">성별
                        <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={field}>{!["여자", "남자"].includes(careworker.careworkerGender) && <option>{careworker.careworkerGender}</option>}<option>여자</option><option>남자</option></select>
                    </label>
                    <label className="block text-xs font-semibold text-slate-600">나이<input type="number" min="0" max="100" value={form.age} onChange={(e) => update("age", e.target.value)} className={field} /></label>
                    <label className="block text-xs font-semibold text-slate-600">시급(원)<input type="number" min="0" value={form.hourWage} onChange={(e) => update("hourWage", e.target.value)} className={field} placeholder="예: 13000" /></label>
                    <AddressField key={detailKey} className="sm:col-span-2" value={form.address} onChange={(v) => update("address", v)} />
                    <label className="block text-xs font-semibold text-slate-600">근무 상태
                        <select value={form.state} onChange={(e) => update("state", e.target.value)} className={field}>{!["근무중", "휴직", "퇴사"].includes(careworker.careworkerState) && <option>{careworker.careworkerState}</option>}<option>근무중</option><option>휴직</option><option>퇴사</option></select>
                    </label>
                    <label className="block text-xs font-semibold text-slate-600">소속 센터
                        <select value={form.centerNo} onChange={(e) => update("centerNo", e.target.value)} className={field}>
                            {!centers.some((c) => c.centerNo === careworker.centerNo) && <option value={careworker.centerNo}>현재 소속 센터 (번호 {careworker.centerNo})</option>}
                            {centers.map((c) => <option key={c.centerNo} value={c.centerNo}>{c.centerName}</option>)}
                        </select>
                    </label>
                    {message && <p className="text-xs font-semibold text-rose-600 sm:col-span-2">{message}</p>}
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">취소</button>
                    <button onClick={save} disabled={saving} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "저장 중..." : "수정 저장"}</button>
                </div>
            </div>
        </div>
    );
}
