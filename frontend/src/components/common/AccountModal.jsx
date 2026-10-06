//
import { useEffect, useState } from "react";
import axios from "axios";
import RecipientEditModal from "./RecipientEditModal";

// 계정 관리 모달 — 개인정보 수정 / 수급자 관리 / 계정 탈퇴 (+ 로그아웃)
// guardian : 로그인한 보호자(GuardianDto), recipients : 그 보호자의 수급자 목록, onChanged : 수급자 변경 후 다시 조회
export default function AccountModal({ guardian, recipients = [], onClose, onLogout, onChanged }) {
  const [tab, setTab] = useState("info");
  const fieldCls = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ email: "", phone: "", password: "", passwordConfirm: "" });
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  // 로그인한 보호자의 회원 정보를 axios로 조회 : GET /user?no=회원번호
  useEffect(() => {
    async function loadUser() {
      if (!guardian?.userNo) return;
      try {
        const response = await axios.get("http://localhost:8080/user", { params: { no: guardian.userNo }, withCredentials: true });
        setUser(response.data);
        setForm((current) => ({ ...current, email: response.data.email ?? "", phone: response.data.phoneNumber ?? "" }));
      } catch (error) {
        console.error("회원 정보 조회 실패:", error);
        setMessage("회원 정보를 불러오지 못했습니다.");
      }
    }
    loadUser();
  }, [guardian?.userNo]);

  // 개인정보 수정 : PUT /user (비밀번호는 입력했을 때만 변경)
  const saveInfo = async () => {
    setMessage("");
    if (!user) return;
    if (form.password && form.password.length < 8) { setMessage("비밀번호는 8자 이상이어야 합니다."); return; }
    if (form.password !== form.passwordConfirm) { setMessage("비밀번호 확인이 일치하지 않습니다."); return; }
    try {
      const response = await axios.put(
        "http://localhost:8080/user",
        { userNo: user.userNo, userId: user.userId, email: form.email, phoneNumber: form.phone, userPassword: form.password || null },
        { withCredentials: true }
      );
      if (response.data) { setSaved(true); update("password", ""); update("passwordConfirm", ""); }
      else setMessage("저장에 실패했습니다.");
    } catch (error) {
      console.error(error);
      setMessage("서버 통신 오류가 발생했습니다.");
    }
  };

  // 계정 탈퇴 : DELETE /user?no=회원번호 (쿼리 파라미터로 전달)
  const withdraw = async () => {
    setMessage("");
    if (confirmText !== "탈퇴합니다") { setMessage("확인 문구를 정확히 입력해주세요."); return; }
    try {
      const response = await axios.delete("http://localhost:8080/user", { params: { no: guardian.userNo }, withCredentials: true });
      if (response.data) onLogout();
      else setMessage("탈퇴 처리에 실패했습니다.");
    } catch (error) {
      console.error(error);
      setMessage("탈퇴할 수 없습니다. 연결된 보호자·수급자 정보가 남아 있으면 센터에 문의해주세요.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900">계정 관리</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-lg">✕</button>
        </div>
        {/* 탭 */}
        <div className="flex border-b border-slate-100">
          {[["info", "개인정보 수정"], ["recipient", "수급자 관리"], ["withdraw", "계정 탈퇴"]].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setSaved(false); setMessage(""); }}
              className={`flex-1 py-3 text-sm font-semibold transition ${tab === id ? "border-b-2 border-teal-600 text-teal-600" : "text-slate-400 hover:text-slate-700"}`}>
              {label}
            </button>
          ))}
        </div>
        {/* 콘텐츠 */}
        <div className="px-6 py-5">
          {tab === "info" && (
            saved ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-xl text-teal-600">✓</div>
                <p className="mt-3 text-sm font-semibold text-slate-800">개인정보가 수정되었습니다.</p>
                <button onClick={() => setSaved(false)} className="mt-4 text-xs text-teal-600 hover:underline">다시 수정하기</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-slate-600">아이디<input className={`${fieldCls} bg-slate-50`} value={user?.userId ?? ""} disabled /></label>
                  <label className="block text-xs font-semibold text-slate-600">연락처<input className={fieldCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label>
                </div>
                <label className="block text-xs font-semibold text-slate-600">이메일<input type="email" className={fieldCls} value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
                <label className="block text-xs font-semibold text-slate-600">비밀번호 변경 (새 비밀번호)<input type="password" className={fieldCls} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="변경할 경우에만 입력" /></label>
                <label className="block text-xs font-semibold text-slate-600">비밀번호 확인<input type="password" className={fieldCls} value={form.passwordConfirm} onChange={(e) => update("passwordConfirm", e.target.value)} placeholder="비밀번호를 한 번 더 입력" /></label>
                {message && <p className="text-xs font-semibold text-rose-600">{message}</p>}
                <div className="flex justify-end pt-1">
                  <button onClick={saveInfo} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">저장하기</button>
                </div>
              </div>
            )
          )}
          {tab === "recipient" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">등록된 어르신의 정보를 수정하거나 삭제할 수 있습니다.</p>
              {recipients.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">등록된 어르신이 없습니다.</p>}
              {recipients.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.name} 어르신</p>
                    <p className="text-xs text-slate-400">{r.address} · {r.age}세 · {r.gender === "female" ? "여성" : "남성"}</p>
                  </div>
                  <button onClick={() => setEditingRecipient(r.raw)} className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50">수정 · 삭제</button>
                </div>
              ))}
            </div>
          )}
          {tab === "withdraw" && (
            <div className="space-y-4">
              <p className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">탈퇴하면 계정이 삭제되며 되돌릴 수 없습니다.</p>
              <label className="block text-xs font-semibold text-slate-600">확인 문구 입력<span className="ml-1 font-normal text-slate-400">("탈퇴합니다" 라고 입력)</span>
                <input className={fieldCls} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="탈퇴합니다" />
              </label>
              {message && <p className="text-xs font-semibold text-rose-600">{message}</p>}
              <div className="flex justify-end">
                <button onClick={withdraw} className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100">탈퇴하기</button>
              </div>
            </div>
          )}
        </div>
        {/* 하단 로그아웃 */}
        <div className="border-t border-slate-100 px-6 py-4">
          <button onClick={onLogout} className="w-full rounded-lg border border-red-100 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-50">로그아웃</button>
        </div>
      </div>
      {editingRecipient && <RecipientEditModal recipient={editingRecipient} onClose={() => setEditingRecipient(null)} onChanged={() => { setEditingRecipient(null); onChanged(); }} />}
    </div>
  );
}
