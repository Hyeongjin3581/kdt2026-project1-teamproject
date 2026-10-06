//
import { useEffect, useState } from "react";
import axios from "axios";
import AddressField from "../../../components/common/AddressField";

// 요양보호사 등록·수정 모달 : POST /api/careworkers, PUT /api/careworkers
// careworker : 수정할 요양보호사의 백엔드 DTO (등록이면 null)
export default function CaregiverFormModal({ careworker, onClose, onSaved }) {
    const isEdit = Boolean(careworker);
    const [centers, setCenters] = useState([]);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [detailKey, setDetailKey] = useState(0); // 개별조회로 값을 채운 뒤 AddressField 를 새로 그리기 위한 키
    const [newAccount, setNewAccount] = useState({ on: false, id: "", password: "" }); // 등록할 때 로그인 계정을 함께 만들기
    const [form, setForm] = useState({
        name: careworker?.careworkerName ?? "",
        gender: careworker?.careworkerGender ?? "여자",
        age: String(careworker?.careworkerAge ?? ""),
        hourWage: String(careworker?.hourWage ?? ""),
        address: careworker?.careworkerAddress ?? "",
        state: careworker?.careworkerState ?? "근무중",
        centerNo: careworker?.centerNo ?? "",
        userNo: careworker?.userNo ?? "",
    });
    const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
    const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    // 소속 센터, 연결할 사용자 계정(요양보호사 회원, 아직 연결 안 된 계정)을 axios로 조회
    useEffect(() => {
        async function loadOptions() {
            try {
                const [centersRes, usersRes, careworkersRes, detailRes] = await Promise.all([
                    axios.get("http://localhost:8080/center", { withCredentials: true }),
                    axios.get("http://localhost:8080/user", { withCredentials: true }),
                    axios.get("http://localhost:8080/api/careworkers", { withCredentials: true }),
                    // 수정할 때는 개별조회로 최신 값을 다시 받아서 채운다 : GET /api/careworkers/detail?careworkerNo=번호
                    isEdit ? axios.get("http://localhost:8080/api/careworkers/detail", { params: { careworkerNo: careworker.careworkerNo }, withCredentials: true }) : Promise.resolve(null),
                ]);
                const detail = detailRes?.data;
                if (detail) {
                    setForm({
                        name: detail.careworkerName ?? "",
                        gender: detail.careworkerGender ?? "여자",
                        age: String(detail.careworkerAge ?? ""),
                        hourWage: String(detail.hourWage ?? ""),
                        address: detail.careworkerAddress ?? "",
                        state: detail.careworkerState ?? "근무중",
                        centerNo: detail.centerNo ?? "",
                        userNo: detail.userNo ?? "",
                    });
                    setDetailKey((k) => k + 1); // 주소 입력칸이 최신 값으로 다시 그려지도록
                }
                const used = new Set(careworkersRes.data.filter((c) => c.careworkerNo !== careworker?.careworkerNo).map((c) => c.userNo));
                const available = usersRes.data.filter((u) => u.userCategoryName === "요양보호사" && !used.has(u.userNo));
                setCenters(centersRes.data);
                setUsers(available);
                if (!careworker && available.length === 0) setNewAccount((current) => ({ ...current, on: true }));
                setForm((current) => ({
                    ...current,
                    centerNo: current.centerNo || centersRes.data[0]?.centerNo || "",
                    userNo: current.userNo || available[0]?.userNo || "",
                }));
            } catch (error) {
                console.error("선택 목록 조회 실패:", error);
                setMessage(isEdit ? "센터/계정 조회가 불가능하여 현재 연결 값을 유지합니다. 기존 요양보호사 정보는 수정할 수 있습니다." : "센터/계정 조회 API가 준비되지 않아 신규 등록할 수 없습니다.");
            }
        }
        loadOptions();
    }, []);

    const save = async () => {
        if (saving) return; // 저장 중 연속 클릭 방지 (계정이 여러 개 만들어지는 것 방지)
        const usingNewAccount = !isEdit && newAccount.on;
        if (!form.name.trim() || !form.age || !form.hourWage || !form.address.trim() || !form.centerNo || (!usingNewAccount && !form.userNo)) {
            setMessage("모든 항목을 입력하고 센터와 연결 계정을 선택해주세요.");
            return;
        }
        if (usingNewAccount && (!newAccount.id.trim() || newAccount.password.length < 8)) {
            setMessage("새 계정의 아이디와 8자 이상의 비밀번호를 입력해주세요.");
            return;
        }
        setSaving(true);
        setMessage("");
        let userNo = form.userNo;
        let createdUserNo = null; // 이번 저장에서 새로 만든 계정 (요양보호사 저장이 실패하면 되돌리기 위해 기억)
        try {
            if (usingNewAccount) {
                // 요양보호사 로그인 계정 생성 : POST /user (사용자 카테고리 2 = 요양보호사) 후 회원번호를 다시 조회
                const newId = newAccount.id.trim();
                const before = await axios.get("http://localhost:8080/user", { withCredentials: true });
                if (before.data.some((u) => u.userId === newId)) { setMessage("이미 사용 중인 아이디입니다. 다른 아이디를 입력하거나 '연결할 로그인 계정'에서 선택해주세요."); return; }
                const created = await axios.post("http://localhost:8080/user", { userId: newId, userPassword: newAccount.password, email: newId, phoneNumber: "", userCategoryNo: 2 }, { withCredentials: true });
                if (!created.data) { setMessage("계정 생성에 실패했습니다. 아이디 중복 여부를 확인해주세요."); return; }
                const after = await axios.get("http://localhost:8080/user", { withCredentials: true });
                const known = new Set(before.data.map((u) => u.userNo));
                createdUserNo = after.data.find((u) => u.userId === newId && !known.has(u.userNo))?.userNo; // 이번에 새로 생긴 계정
                if (!createdUserNo) { setMessage("생성한 계정을 찾지 못했습니다."); return; }
                userNo = createdUserNo;
            }
            const body = {
                careworkerName: form.name.trim(),
                careworkerGender: form.gender,
                careworkerAge: Number(form.age),
                hourWage: Number(form.hourWage),
                careworkerAddress: form.address.trim(),
                careworkerState: form.state,
                centerNo: Number(form.centerNo),
                userNo: Number(userNo),
            };
            // axios.post / axios.put("통신할주소", { body }, { 옵션 }) → 컨트롤러가 boolean 을 반환
            const response = isEdit
                ? await axios.put("http://localhost:8080/api/careworkers", { ...body, careworkerNo: careworker.careworkerNo }, { withCredentials: true })
                : await axios.post("http://localhost:8080/api/careworkers", body, { withCredentials: true });
            if (response.data) { onSaved(); return; }
            throw new Error("저장 실패");
        } catch (error) {
            console.error(error);
            setMessage("저장에 실패했습니다. 입력 정보를 확인해주세요.");
            if (createdUserNo) { // 요양보호사 저장이 실패했으면 방금 만든 계정을 지워 빈 계정이 쌓이지 않게 한다
                try { await axios.delete("http://localhost:8080/user", { params: { no: createdUserNo }, withCredentials: true }); } catch (cleanupError) { console.error(cleanupError); }
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-display text-lg font-bold text-slate-900">{isEdit ? "요양보호사 수정" : "요양보호사 등록"}</h2>
                    <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
                </div>
                <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-slate-600">성명<input value={form.name} onChange={(e) => update("name", e.target.value)} className={field} placeholder="예: 정미숙" /></label>
                    <label className="block text-xs font-semibold text-slate-600">성별
                        <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={field}>{isEdit && !["여자", "남자"].includes(careworker.careworkerGender) && <option>{careworker.careworkerGender}</option>}<option>여자</option><option>남자</option></select>
                    </label>
                    <label className="block text-xs font-semibold text-slate-600">나이<input type="number" min="0" max="100" value={form.age} onChange={(e) => update("age", e.target.value)} className={field} /></label>
                    <label className="block text-xs font-semibold text-slate-600">시급(원)<input type="number" min="0" value={form.hourWage} onChange={(e) => update("hourWage", e.target.value)} className={field} placeholder="예: 13000" /></label>
                    <AddressField key={detailKey} className="sm:col-span-2" value={form.address} onChange={(v) => update("address", v)} />
                    <label className="block text-xs font-semibold text-slate-600">근무 상태
                        <select value={form.state} onChange={(e) => update("state", e.target.value)} className={field}>{isEdit && !["근무중", "휴직", "퇴사"].includes(careworker.careworkerState) && <option>{careworker.careworkerState}</option>}<option>근무중</option><option>휴직</option><option>퇴사</option></select>
                    </label>
                    <label className="block text-xs font-semibold text-slate-600">소속 센터
                        <select value={form.centerNo} onChange={(e) => update("centerNo", e.target.value)} className={field}>
                            {isEdit && !centers.some((c) => c.centerNo === careworker.centerNo) && <option value={careworker.centerNo}>현재 소속 센터 (번호 {careworker.centerNo})</option>}
                            {centers.map((c) => <option key={c.centerNo} value={c.centerNo}>{c.centerName}</option>)}
                        </select>
                    </label>
                    {!isEdit && <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 sm:col-span-2"><input type="checkbox" checked={newAccount.on} onChange={(e) => setNewAccount((current) => ({ ...current, on: e.target.checked }))} className="h-4 w-4 accent-teal-600" />새 로그인 계정을 함께 만들기</label>}
                    {!isEdit && newAccount.on ? <>
                        <label className="block text-xs font-semibold text-slate-600">계정 아이디(이메일)<input value={newAccount.id} onChange={(e) => setNewAccount((current) => ({ ...current, id: e.target.value }))} className={field} placeholder="예: careworker04@example.com" /></label>
                        <label className="block text-xs font-semibold text-slate-600">비밀번호<input type="password" value={newAccount.password} onChange={(e) => setNewAccount((current) => ({ ...current, password: e.target.value }))} className={field} placeholder="8자 이상" /></label>
                    </> : <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">연결할 로그인 계정 <span className="font-normal text-slate-400">(요양보호사 회원 중 미연결 계정)</span>
                        <select value={form.userNo} onChange={(e) => update("userNo", e.target.value)} className={field}>
                            {isEdit && careworker?.userNo && !users.some((u) => u.userNo === careworker.userNo) && <option value={careworker.userNo}>현재 연결 계정 (번호 {careworker.userNo})</option>}
                            {users.map((u) => <option key={u.userNo} value={u.userNo}>{u.userId} (회원번호 {u.userNo})</option>)}
                        </select>
                    </label>}
                    {message && <p className="text-xs font-semibold text-rose-600 sm:col-span-2">{message}</p>}
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">취소</button>
                    <button onClick={save} disabled={saving} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "저장 중..." : isEdit ? "수정 저장" : "등록"}</button>
                </div>
            </div>
        </div>
    );
}
