//
import { useEffect } from "react";
import Login from "./Login";
import Signup from "./Signup";

const TABS = [
  { value: "login", label: "로그인" },
  { value: "signup", label: "회원가입" },
];

const COPY = {
  login: { title: "로그인", desc: "온케어에 오신 것을 환영합니다. 아이디와 비밀번호를 입력해 주세요." },
  signup: { title: "회원가입", desc: "보호자 또는 요양보호사를 선택하고 정보를 입력하세요. 요양보호사 계정은 관리자 승인 후 이용할 수 있습니다." },
};

// 랜딩 페이지 위에 뜨는 로그인/회원가입 창
// mode : "login" | "signup", onModeChange : 탭 전환, onClose : 창 닫기, login : 로그인한 UserDto 를 App.jsx 로 넘긴다
export default function AuthModal({ mode, onModeChange, onClose, login }) {
  // Esc 로 닫고, 창이 떠 있는 동안 뒤 페이지 스크롤을 막는다
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" className="relative max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-[28px] bg-white text-slate-700 shadow-2xl">
        {/* 상단 안내 */}
        <div className="bg-gradient-to-b from-teal-50 to-white px-8 pb-2 pt-8">
          <button type="button" onClick={onClose} aria-label="닫기" className="absolute right-6 top-6 grid h-9 w-9 place-items-center rounded-full bg-white/70 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
          </button>
          <p className="font-mono text-xs font-bold tracking-[.18em] text-teal-700">ACCOUNT</p>
          <h2 id="auth-modal-title" className="mt-3 font-display text-3xl font-extrabold text-slate-900">{COPY[mode].title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">{COPY[mode].desc}</p>
        </div>

        <div className="px-8 pb-8">
          {/* 로그인 / 회원가입 탭 */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5">
            {TABS.map((t) => (
              <button key={t.value} type="button" onClick={() => onModeChange(t.value)} className={`rounded-xl py-3 text-sm font-bold transition ${mode === t.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
            ))}
          </div>

          {mode === "login" ? <Login login={login} /> : <Signup onLogin={() => onModeChange("login")} />}
        </div>
      </div>
    </div>
  );
}
