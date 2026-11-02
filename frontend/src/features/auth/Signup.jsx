//
//
import { useState } from "react";
import axios from "axios";
import CaregiverSignupForm from "./CaregiverSignupForm"; // 요양보호사 전용 가입 폼 (2026. 10. 06 병합)

// 가입할 때 선택하는 회원 유형 : 백엔드 usercategory 테이블의 번호와 맞춘다. (2 = 요양보호사는 CaregiverSignupForm 으로 가입)
// 센터 관리자(3)·시스템 관리자(4)는 가입으로 만들지 않으므로 목록에서 뺐다. (시스템 관리자는 admin01 계정 하나만 사용)
const POSITIONS = [
  { value: "guardian", label: "보호자", userCategoryNo: 1 },
  { value: "caregiver", label: "요양보호사", userCategoryNo: 2 }, // 선택 시 CaregiverSignupForm 사용
];

// 보호자가 수급자와 맺는 관계 (guardians.guardian_relationship 에 저장, 최대 20자)
const RELATIONSHIPS = ["아들", "딸", "배우자", "며느리", "사위", "손주", "형제·자매", "기타"];

// 회원가입 폼 : AuthModal 의 '회원가입' 탭에 들어간다. onLogin : 가입 후 '로그인' 탭으로 전환
export default function Signup({ onLogin }) {
  const [role, setRole] = useState("guardian"); // 선택한 회원 유형 (POSITIONS 의 value)
  const position = POSITIONS.find((p) => p.value === role);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState("");  // 로그인 아이디 (user.user_id)
  const [email, setEmail] = useState("");    // 이메일 (user.email) : 아이디와 별개로 저장
  const [verificationCode, setVerificationCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const changeRole = (nextRole) => {
    setRole(nextRole);
    setEmailSent(false);
    setEmailVerified(false);
    setVerificationCode("");
    setVerificationMessage("");
  };

  // 이메일 인증번호 발송 (POST /user/email/send)
  const sendVerificationEmail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setVerificationMessage("올바른 이메일 주소를 입력해주세요.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:8080/user/email/send", {email} , {withCredentials : true});
      if(response.data){
        setEmailSent(true);
        setEmailVerified(false);
        setVerificationCode("");
        setVerificationMessage("인증번호를 입력한 메일로 발송했습니다. 5분 안에 입력해주세요. (스팸함도 확인)");
      } else {
        setVerificationMessage("발송하지 못했습니다. 1분 후에 다시 시도해주세요.")
      }
    } catch {
      setVerificationMessage("서버에 연결할 수 없습니다. 실행 상태를 확인하세요.")
    }
  };

  // 이메일 인증번호 확인 (POST /user/email/verify)
  const verifyEmail = async () => {
    try {
      const response = await axios.post("http://localhost:8080/user/email/verify", {email, code: verificationCode }, {withCredentials: true});
      if (response.data) {
        setEmailVerified(true);
        setVerificationMessage("이메일 인증이 완료되었습니다.")
      } else {
        setVerificationMessage("인증번호가 일치하지 않거나 만료되었습니다.")
      }
    } catch {
      setVerificationMessage("서버에 연결할 수 없습니다. 실행 상태를 확인하세요.")
    }
  };

  const submitSignup = async () => {
    setSubmitError("");
    if (role === "guardian" && !emailVerified) {
      setVerificationMessage("가입 전 이메일 인증을 완료해주세요.");
      return;
    }
    if (role === "guardian" && !name.trim()) {
      setSubmitError("보호자 이름을 입력해주세요.");
      return;
    }
    if (!userId.trim() || !email.trim() || !password) {
      setSubmitError("아이디, 이메일, 비밀번호를 입력해주세요.");
      return;
    }
    if (/\s/.test(userId.trim())) {
      setSubmitError("아이디에는 공백을 사용할 수 없습니다.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSubmitError("이메일 형식을 확인해주세요.");
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
      // 같은 아이디가 이미 있으면 서버에 보내지 않는다 (서버에 아이디 중복 검사가 없음)
      const users = await axios.get("http://localhost:8080/user", { withCredentials: true });
      if (users.data.some((u) => u.userId === userId.trim())) {
        setSubmitError("이미 사용 중인 아이디입니다.");
        return;
      }
      // axios.post("통신할주소", { body }, { 옵션 }) → 컨트롤러가 boolean 을 반환
      const response = await axios.post(
        "http://localhost:8080/user",
        // 보호자(1)는 guardianName, guardianRelationship 도 함께 보내 서버가 user 와 guardians 를 한 번에 만들게 한다. (관리자는 보내지 않음)
        { userId: userId.trim(), userPassword: password, email: email.trim(), phoneNumber: phone, userCategoryNo, ...(role === "guardian" ? { guardianName: name.trim(), guardianRelationship: relationship } : {}) },
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

  if (done) {
    return (
      <div className="grid min-h-[360px] place-items-center text-center">
        <div>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
          <h2 className="mt-5 font-display text-2xl font-extrabold text-slate-900">가입 신청이 완료되었습니다</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            이제 로그인하여 우리 어르신의 방문 일정을 확인할 수 있습니다.
          </p>
          <button onClick={onLogin} className="mt-6 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700">로그인하러 가기</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <label className="mt-6 block text-xs font-semibold text-slate-600">어떤 분이신가요?
        <select value={role} onChange={(event) => changeRole(event.target.value)} className={field}>
          {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </label>
      {/* 요양보호사는 전용 가입 폼, 그 외(보호자·관리자)는 아래 공용 폼 (2026. 10. 06 병합) */}
      {role === "caregiver" ? <CaregiverSignupForm onLogin={onLogin} /> : <>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">이름<input value={name} onChange={(event) => setName(event.target.value)} maxLength={10} className={field} placeholder="홍길동" /></label>
        <label className="text-xs font-semibold text-slate-600">연락처<input value={phone} onChange={(event) => setPhone(event.target.value)} className={field} placeholder="010-0000-0000" /></label>
        {role === "guardian" && <label className="text-xs font-semibold text-slate-600 sm:col-span-2">수급자(어르신)와의 관계
          <select value={relationship} onChange={(event) => setRelationship(event.target.value)} className={field}>
            {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>}
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">아이디<input autoComplete="username" value={userId} onChange={(event) => setUserId(event.target.value)} className={field} placeholder="로그인에 사용할 아이디" /></label>
        <div className="text-xs font-semibold text-slate-600 sm:col-span-2">이메일
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
      </div>
      <label className="mt-5 flex items-start gap-2 text-xs text-slate-500"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-teal-600" /><span>서비스 이용약관 및 개인정보 처리방침에 동의합니다. (필수)</span></label>
      {submitError && <p className="mt-4 text-xs font-semibold text-rose-600">{submitError}</p>}
      <button onClick={submitSignup} disabled={submitting || (role === "guardian" && !emailVerified)} className="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? "가입 중..." : "가입하기"}</button>
      </>}
    </>
  );
}
