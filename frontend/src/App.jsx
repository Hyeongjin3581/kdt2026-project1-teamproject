import { useState } from "react";
import Login from "./features/auth/Login";
import Signup from "./features/auth/Signup";
import AdminApp from "./features/admin/AdminApp";
import GuardianApp from "./features/guardian/GuardianApp";

function OncareApp() {
  const [role, setRole] = useState(null);
  const [authView, setAuthView] = useState("login");
  const logout = () => { setRole(null); setAuthView("login"); };
  if (role === null) return authView === "signup" ? <Signup toLogin={() => setAuthView("login")} /> : <Login login={setRole} toSignup={() => setAuthView("signup")} />;
  if (role === "admin") return <AdminApp logout={logout} />;
  return <GuardianApp logout={logout} />;
}

export default function App() {
  // 폰 프레임(iframe) 안에서 렌더될 때는 토글 UI 없이 앱만 보여줍니다 (재귀 방지).
  const framed = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("frame") === "off";
  const [mobile, setMobile] = useState(false);
  if (framed) return <OncareApp />;

  return (
    <>
      {mobile ? (
        <div className="grid min-h-screen place-items-center bg-[#06231d] p-6">
          <div className="relative">
            <div className="mx-auto h-[812px] w-[390px] overflow-hidden rounded-[44px] border-[10px] border-[#0b3128] bg-black shadow-2xl">
              <div className="absolute left-1/2 top-[10px] z-10 h-6 w-32 -translate-x-1/2 rounded-full bg-[#0b3128]" />
              <iframe title="모바일 미리보기" src="?frame=off" className="h-full w-full border-0 bg-white" />
            </div>
            <p className="mt-4 text-center font-mono text-[11px] tracking-widest text-teal-200/70">MOBILE PREVIEW · 390 × 812</p>
          </div>
        </div>
      ) : (
        <OncareApp />
      )}
      <button
        type="button"
        onClick={() => setMobile((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/25 transition hover:bg-teal-700"
      >
        {mobile ? (
          <><span aria-hidden>🖥️</span> 데스크톱 보기</>
        ) : (
          <><span aria-hidden>📱</span> 모바일 보기</>
        )}
      </button>
    </>
  );
}
