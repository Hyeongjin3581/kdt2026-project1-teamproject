import { useState } from "react";
import axios from "axios";

// 요양보호사 로그인 : 관리자·보호자와 같은 POST /user/login 을 쓴다.
// 서버는 가입 승인(sign_state = 승인완료) 전인 요양보호사의 로그인을 null 로 거절한다.
export default function CaregiverLoginForm({ login }) {
  const [userId, setUserId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 아이디가 가입 승인 대기(sign_state = 승인대기) 중인 요양보호사 계정인지 확인한다 : GET /user, GET /api/careworkers
  async function isPendingAccount(id) {
    try {
      const users = await axios.get("http://localhost:8080/user", { withCredentials: true });
      const account = users.data.find((u) => u.userId === id && u.userCategoryNo === 2);
      if (!account) return false;
      const careworkers = await axios.get("http://localhost:8080/api/careworkers", { withCredentials: true });
      return careworkers.data.find((c) => c.userNo === account.userNo)?.signState === "승인대기";
    } catch (error) {
      return false; // 조회에 실패하면 일반 문구로 안내
    }
  }

  // 로그인 요청 : axios.post("통신할주소", { body }, { 옵션 }) → 로그인한 UserDto (실패하면 빈 응답)
  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!userId.trim() || !userPassword) { setMessage("아이디와 비밀번호를 입력해주세요."); return; }
    setSubmitting(true);
    setMessage("");
    try {
      const response = await axios.post("http://localhost:8080/user/login", { userId: userId.trim(), userPassword }, { withCredentials: true });
      if (!response.data) {
        // 서버는 '승인 대기'와 '아이디·비밀번호 불일치'를 똑같이 빈 응답으로 거절한다.
        // 그래서 그 아이디가 승인 대기 중인 요양보호사인지 따로 조회해서 안내 문구를 나눈다.
        setMessage(await isPendingAccount(userId.trim()) ? "가입 승인 대기 중인 계정입니다. 관리자가 승인하면 로그인할 수 있습니다." : "아이디 또는 비밀번호가 일치하지 않습니다.");
        return;
      }
      if (response.data.userCategoryNo !== 2) {
        // 요양보호사가 아닌 계정 : 서버가 발급한 로그인 쿠키를 되돌리고 안내
        await axios.post("http://localhost:8080/user/logout", {}, { withCredentials: true }).catch(() => {});
        setMessage("요양보호사 계정이 아닙니다. 위에서 관리자 또는 보호자를 선택해 로그인해주세요.");
        return;
      }
      login(response.data); // App.jsx 의 setUser → 요양보호사 화면으로 이동
    } catch (error) {
      console.error(error);
      setMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 관리자·보호자 로그인(Login.jsx)과 같은 입력칸·버튼 모양으로 맞춘다
  const inputClass = "mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  return (
    <>
      {/* 아이디 입력 칸 */}
      <label className="mt-6 block text-xs font-semibold text-slate-600">아이디</label>
      <input className={inputClass} value={userId} onChange={(event) => { setUserId(event.target.value); setMessage(""); }} placeholder="아이디" />

      {/* 비밀번호 입력 칸 */}
      <label className="mt-5 block text-xs font-semibold text-slate-600">비밀번호</label>
      <input className={inputClass} type="password" value={userPassword} onChange={(event) => { setUserPassword(event.target.value); setMessage(""); }} onKeyDown={(event) => event.key === "Enter" && submit(event)} placeholder="비밀번호" />

      {message && <p role="alert" className="mt-4 text-xs font-semibold text-rose-600">{message}</p>}
      <button onClick={submit} disabled={submitting} className="mt-7 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? "로그인 확인 중..." : "요양보호사 로그인"}</button>
      <p className="mt-4 text-center text-[11px] text-slate-400">관리자 승인 후 일정과 가용시간을 관리합니다.</p>
    </>
  );
}
