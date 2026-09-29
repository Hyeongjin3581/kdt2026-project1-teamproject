import { useEffect, useState } from "react";
import axios from "axios";

// 요양보호사 등록·수정 모달 : POST /api/careworkers, PUT /api/careworkers
// careworker : 수정할 요양보호사의 백엔드 DTO (등록이면 null)
export default function CaregiverFormModal({ careworker, onClose, onSaved }) {
    const isEdit = Boolean(careworker);
    const [centers, setCenters] = useState([]);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
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
                const [centersRes, usersRes, careworkersRes] = await Promise.all([
                    axios.get("http://localhost:8080/center", { withCredentials: true }),
                    axios.get("http://localhost:8080/user", { withCredentials: true }),
                    axios.get("http://localhost:8080/api/careworkers", { withCredentials: true }),
                ]);
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
                setMessage("센터/계정 목록을 불러오지 못했습니다.");
            }
        }
        loadOptions();
    }, []);

    const save = async () => {
        const usingNewAccount = !isEdit && newAccount.on;
        if (!form.name.trim() || !form.age || !form.hourWage || !form.address.trim() || !form.centerNo || (!usingNewAccount && !form.userNo)) {
            setMessage("모든 항목을 입력하고 센터와 연결 계정을 선택해주세요.");
            return;
        }
        if (usingNewAccount && (!newAccount.id.trim() || newAccount.password.length < 8)) {
            setMessage("새 계정의 아이디와 8자 이상의 비밀번호를 입력해주세요.");
            return;
        }
        let userNo = form.userNo;
        if (usingNewAccount) {
            try {
                // 요양보호사 로그인 계정 생성 : POST /user (사용자 카테고리 2 = 요양보호사) 후 회원번호를 다시 조회
                const created = await axios.post("http://localhost:8080/user", { userId: newAccount.id.trim(), userPassword: newAccount.password, email: newAccount.id.trim(), phoneNumber: "", userCategoryNo: 2 }, { withCredentials: true });
                if (!created.data) { setMessage("계정 생성에 실패했습니다. 아이디 중복 여부를 확인해주세요."); return; }
                const usersRes = await axios.get("http://localhost:8080/user", { withCredentials: true });
                userNo = usersRes.data.find((u) => u.userId === newAccount.id.trim())?.userNo;
                if (!userNo) { setMessage("생성한 계정을 찾지 못했습니다."); return; }
            } catch (error) {
                console.error(error);
                setMessage("계정 생성 중 서버 통신 오류가 발생했습니다.");
                return;
            }
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
        try {
            // axios.post / axios.put("통신할주소", { body }, { 옵션 }) → 컨트롤러가 boolean 을 반환
            const response = isEdit
                ? await axios.put("http://localhost:8080/api/careworkers", { ...body, careworkerNo: careworker.careworkerNo }, { withCredentials: true })
                : await axios.post("http://localhost:8080/api/careworkers", body, { withCredentials: true });
            if (response.data) onSaved();
            else setMessage("저장에 실패했습니다. 입력 정보를 확인해주세요.");
        } catch (error) {
            console.error(error);
            setMessage("서버 통신 오류가 발생했습니다.");
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
                        <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={field}><option>여자</option><option>남자</option></select>
                    </label>
                    <label className="block text-xs font-semibold text-slate-600">나이<input type="number" min="0" max="100" value={form.age} onChange={(e) => update("age", e.target.value)} className={field} /></label>
                    <label className="block text-xs font-semibold text-slate-600">시급(원)<input type="number" min="0" value={form.hourWage} onChange={(e) => update("hourWage", e.target.value)} className={field} placeholder="예: 13000" /></label>
                    <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">주소<input value={form.address} onChange={(e) => update("address", e.target.value)} className={field} placeholder="예: 경기도 안양시 동안구 비산동" /></label>
                    <label className="block text-xs font-semibold text-slate-600">근무 상태
                        <select value={form.state} onChange={(e) => update("state", e.target.value)} className={field}><option>근무중</option><option>휴직</option><option>퇴사</option></select>
                    </label>
                    <label className="block text-xs font-semibold text-slate-600">소속 센터
                        <select value={form.centerNo} onChange={(e) => update("centerNo", e.target.value)} className={field}>
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
                            {users.map((u) => <option key={u.userNo} value={u.userNo}>{u.userId}</option>)}
                        </select>
                    </label>}
                    {message && <p className="text-xs font-semibold text-rose-600 sm:col-span-2">{message}</p>}
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">취소</button>
                    <button onClick={save} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">{isEdit ? "수정 저장" : "등록"}</button>
                </div>
            </div>
        </div>
    );
}
