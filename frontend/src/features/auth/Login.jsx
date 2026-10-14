//
import { useState } from "react";
import axios from "axios";

// 통합 로그인 폼 : 관리자·보호자·요양보호사 모두 POST /user/login 하나로 로그인한다.
// 어느 화면으로 갈지는 응답 UserDto 의 userCategoryNo 로 App.jsx 가 정한다.
// 서버는 가입 승인(sign_state = 승인완료) 전인 요양보호사의 로그인을 null 로 거절한다.
export default function Login({ login }) {
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
      const response = await axios.post(
        "http://localhost:8080/user/login",
        { userId: userId.trim(), userPassword },   // 백엔드 UserDto 필드명과 같아야 함
        { withCredentials: true }                  // 쿠키(accessToken, refreshToken) 저장에 필수
      );
      if (!response.data) {
        // 서버는 '승인 대기'와 '아이디·비밀번호 불일치'를 똑같이 빈 응답으로 거절한다.
        // 그래서 그 아이디가 승인 대기 중인 요양보호사인지 따로 조회해서 안내 문구를 나눈다.
        setMessage(await isPendingAccount(userId.trim()) ? "가입 승인 대기 중인 계정입니다. 관리자가 승인하면 로그인할 수 있습니다." : "아이디 또는 비밀번호가 일치하지 않습니다.");
        return;
      }
      login(response.data); // App.jsx 의 setUser → 역할별 첫 화면으로 이동
    } catch (error) {
      console.error(error);
      setMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const boxClass = "mt-2 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-teal-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100";
  const inputClass = "w-full bg-transparent py-3.5 text-sm outline-none";
  return (
    <form onSubmit={submit} noValidate>
      {/* 아이디 입력 칸 */}
      <label className="mt-6 block text-sm font-bold text-slate-700">아이디</label>
      <div className={boxClass}>
        <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" /></svg>
        <input autoFocus autoComplete="username" className={inputClass} value={userId} onChange={(event) => { setUserId(event.target.value); setMessage(""); }} placeholder="아이디를 입력해 주세요" />
      </div>

      {/* 비밀번호 입력 칸 */}
      <label className="mt-5 block text-sm font-bold text-slate-700">비밀번호</label>
      <div className={boxClass}>
        <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinejoin="round" /></svg>
        <input type="password" autoComplete="current-password" className={inputClass} value={userPassword} onChange={(event) => { setUserPassword(event.target.value); setMessage(""); }} placeholder="비밀번호를 입력해 주세요" />
      </div>

      {message && <p role="alert" className="mt-4 text-xs font-semibold text-rose-600">{message}</p>}
      <button type="submit" disabled={submitting} className="mt-7 w-full rounded-xl bg-teal-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? "로그인 확인 중..." : "로그인"}</button>    </form>
  );
}
