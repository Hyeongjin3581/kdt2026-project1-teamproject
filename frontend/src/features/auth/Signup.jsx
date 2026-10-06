//
//
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppMark from "../../components/common/AppMark";
import axios from "axios";
import CaregiverSignupForm from "./CaregiverSignupForm"; // 요양보호사 전용 가입 폼 (2026. 10. 06 병합)

// 가입할 때 선택하는 직급 : 백엔드 usercategory 테이블의 번호와 맞춘다. (2 = 요양보호사는 CaregiverSignupForm 으로 가입)
const POSITIONS = [
  { value: "guardian", label: "보호자", userCategoryNo: 1, admin: false },
  { value: "center", label: "센터 관리자", userCategoryNo: 3, admin: true },
  { value: "system", label: "시스템 관리자", userCategoryNo: 4, admin: true },
  { value: "caregiver", label: "요양보호사", userCategoryNo: 2, admin: false }, // 선택 시 CaregiverSignupForm 사용
];

// 보호자가 수급자와 맺는 관계 (guardians.guardian_relationship 에 저장, 최대 20자)
const RELATIONSHIPS = ["아들", "딸", "배우자", "며느리", "사위", "손주", "형제·자매", "기타"];

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  // 로그인 화면의 요양보호사 탭에서 넘어오면 요양보호사로 시작하고, 가입 후에도 그 탭으로 돌아간다
  const [role, setRole] = useState(location.state?.role === "caregiver" ? "caregiver" : "guardian"); // 선택한 직급 (POSITIONS 의 value)
  const toLogin = () => role === "caregiver" ? navigate("/login", { state: { role: "caregiver" } }) : navigate("/login");
  const position = POSITIONS.find((p) => p.value === role);
  const isAdmin = position.admin; // 센터·시스템 관리자는 관리자 인증코드가 필요
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const changeRole = (nextRole) => {
    setRole(nextRole);
    setEmailSent(false);
    setEmailVerified(false);
    setVerificationCode("");
    setVerificationMessage("");
    setAdminCode("");
    setAdminVerified(false);
    setAdminMessage("");
  };
  const sendVerificationEmail = () => {
    if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
      setVerificationMessage("Gmail 주소를 입력해주세요.");
      return;
    }
    setEmailSent(true);
    setEmailVerified(false);
    setVerificationMessage("인증번호를 Gmail로 발송했습니다. 테스트 인증번호는 123456입니다.");
  };
  const verifyEmail = () => {
    if (verificationCode === "123456") {
      setEmailVerified(true);
      setVerificationMessage("이메일 인증이 완료되었습니다.");
      return;
    }
    setVerificationMessage("인증번호가 일치하지 않습니다. 다시 확인해주세요.");
  };
  const verifyAdminCode = () => {
    if (adminCode === "123456") {
      setAdminVerified(true);
      setAdminMessage("관리자 인증이 완료되었습니다.");
      return;
    }
    setAdminMessage("관리자 인증코드가 일치하지 않습니다.");
  };
  const submitSignup = async () => {
    setSubmitError("");
    if (role === "guardian" && !emailVerified) {
      setVerificationMessage("가입 전 Gmail 인증을 완료해주세요.");
      return;
    }
    if (isAdmin && !adminVerified) {
      setAdminMessage("가입 전 관리자 인증을 완료해주세요.");
      return;
    }
    if (role === "guardian" && !name.trim()) {
      setSubmitError("보호자 이름을 입력해주세요.");
      return;
    }
    if (!email || !password) {
      setSubmitError("아이디(이메일)와 비밀번호를 입력해주세요.");
      return;
    }
    if (password.length < 8) {
      setSubmitError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setSubmitError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    const userCategoryNo = position.userCategoryNo;
    setSubmitting(true);
    try {
      // axios.post("통신할주소", { body }, { 옵션 }) → 컨트롤러가 boolean 을 반환
      const response = await axios.post(
        "http://localhost:8080/user",
        // 보호자(1)는 guardianName, guardianRelationship 도 함께 보내 서버가 user 와 guardians 를 한 번에 만들게 한다. (관리자는 보내지 않음)
        { userId: email, userPassword: password, email, phoneNumber: phone, userCategoryNo, ...(role === "guardian" ? { guardianName: name.trim(), guardianRelationship: relationship } : {}) },
        { withCredentials: true }
      );
      if (response.data) setDone(true);
      else setSubmitError("가입에 실패했습니다. 입력 정보를 확인해주세요.");
    } catch (error) {
      setSubmitError(error.response ? `회원가입 요청 실패: ${error.config.url} (HTTP ${error.response.status})` : "서버에 연결할 수 없습니다. 실행 상태를 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#06231d] p-5 text-white">
      <div className="w-full max-w-[960px] overflow-hidden rounded-2xl bg-white shadow-2xl md:grid md:grid-cols-[.95fr_1.05fr]">
        <div className="hidden min-h-[620px] flex-col justify-between bg-gradient-to-br from-teal-600 to-emerald-800 p-10 md:flex">
          <div className="flex items-center gap-3"><AppMark /><span className="font-display text-xl font-bold">온케어 스케줄</span></div>
          <div>
            <p className="font-mono text-xs tracking-[.22em] text-teal-100">CREATE ACCOUNT</p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">온케어와 함께<br />돌봄을 시작하세요.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-teal-50/90">보호자는 Gmail 인증 후 가입하고, 요양보호사·관리자 계정은 센터 승인 후 이용할 수 있습니다.</p>
          </div>
          <p className="text-xs text-teal-100/80">ONCARE · 재가 방문요양 운영 시스템</p>
        </div>
        <div className="p-7 sm:p-11">
          {done ? (
            <div className="grid min-h-[440px] place-items-center text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
                <h2 className="mt-5 font-display text-2xl font-extrabold text-slate-900">가입 신청이 완료되었습니다</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {isAdmin ? `${position.label} 계정이 생성되었습니다. 이제 로그인하여 센터 운영 현황을 확인할 수 있습니다.` : "이제 로그인하여 우리 어르신의 방문 일정을 확인할 수 있습니다."}
                </p>
                <button onClick={toLogin} className="mt-6 rounded-lg bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700">로그인하러 가기</button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center gap-2 text-slate-900 md:hidden"><AppMark /><b className="font-display text-xl">온케어 스케줄</b></div>
              <p className="font-mono text-[11px] font-bold tracking-[.15em] text-teal-600">SIGN UP</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-900">회원가입</h2>
              <p className="mt-2 text-sm text-slate-500">직급을 선택하고 정보를 입력하세요.</p>
              <label className="mt-5 block text-xs font-semibold text-slate-600">직급
                <select value={role} onChange={(event) => changeRole(event.target.value)} className={field}>
                  {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
              {/* 요양보호사는 전용 가입 폼, 그 외(보호자·관리자)는 아래 공용 폼 (2026. 10. 06 병합) */}
              {role === "caregiver" ? <CaregiverSignupForm onLogin={toLogin} /> : <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">이름<input value={name} onChange={(event) => setName(event.target.value)} maxLength={10} className={field} placeholder="홍길동" /></label>
                <label className="text-xs font-semibold text-slate-600">연락처<input value={phone} onChange={(event) => setPhone(event.target.value)} className={field} placeholder="010-0000-0000" /></label>
                {role === "guardian" && <label className="text-xs font-semibold text-slate-600 sm:col-span-2">수급자(어르신)와의 관계
                  <select value={relationship} onChange={(event) => setRelationship(event.target.value)} className={field}>
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>}
                <div className="text-xs font-semibold text-slate-600 sm:col-span-2">아이디 (이메일)
                  <div className="mt-1.5 flex gap-2">
                    <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailVerified(false); }} disabled={role === "guardian" && emailVerified} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50" placeholder="you@gmail.com" />
                    {role === "guardian" && <button type="button" onClick={sendVerificationEmail} disabled={emailVerified} className="shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-teal-700 transition hover:bg-teal-100 disabled:cursor-default disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700">{emailVerified ? "인증 완료" : emailSent ? "재발송" : "인증 메일"}</button>}
                  </div>
                </div>
                {role === "guardian" && <div className="sm:col-span-2">
                  <div className="flex items-end gap-2">
                    <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">인증번호
                      <input inputMode="numeric" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))} disabled={!emailSent || emailVerified} className={field} placeholder="6자리 숫자" />
                    </label>
                    <button type="button" onClick={verifyEmail} disabled={!emailSent || emailVerified || verificationCode.length !== 6} className="mb-0.5 shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400">인증 확인</button>
                  </div>
                  {verificationMessage && <p className={`mt-1.5 text-[11px] ${emailVerified ? "text-emerald-600" : "text-slate-500"}`}>{verificationMessage}</p>}
                </div>}
                <label className="text-xs font-semibold text-slate-600">비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={field} placeholder="8자 이상" /></label>
                <label className="text-xs font-semibold text-slate-600">비밀번호 확인<input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} className={field} placeholder="다시 입력" /></label>
                {isAdmin && <div className="sm:col-span-2">
                  <div className="flex items-end gap-2">
                    <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">관리자 인증코드
                      <input inputMode="numeric" maxLength={6} value={adminCode} onChange={(event) => { setAdminCode(event.target.value.replace(/\D/g, "")); setAdminVerified(false); }} disabled={adminVerified} className={field} placeholder="6자리 숫자" />
                    </label>
                    <button type="button" onClick={verifyAdminCode} disabled={adminVerified || adminCode.length !== 6} className="mb-0.5 shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400">{adminVerified ? "인증 완료" : "인증 확인"}</button>
                  </div>
                  <p className={`mt-1.5 text-[11px] ${adminVerified ? "text-emerald-600" : "text-slate-500"}`}>{adminMessage || "관리자 인증코드 6자리를 입력해주세요."}</p>
                </div>}
              </div>
              <label className="mt-5 flex items-start gap-2 text-xs text-slate-500"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-teal-600" /><span>서비스 이용약관 및 개인정보 처리방침에 동의합니다. (필수)</span></label>
              {submitError && <p className="mt-4 text-xs font-semibold text-rose-600">{submitError}</p>}
              <button onClick={submitSignup} disabled={submitting || (role === "guardian" && !emailVerified) || (isAdmin && !adminVerified)} className="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? "가입 중..." : "가입하기"}</button>
              </>}
              <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">이미 계정이 있으신가요? <button onClick={toLogin} className="font-bold text-teal-600 hover:underline">로그인</button></div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
