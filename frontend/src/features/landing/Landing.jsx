//
import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "../auth/AuthModal";
import SiteHeader from "./SiteHeader";

// 히어로 배경 사진 : public/landing-hero.jpg 를 넣으면 표시되고, 없으면 그라데이션만 보인다
const heroBackground = {
  backgroundColor: "#134e4a",
  backgroundImage: "linear-gradient(90deg, rgba(6,35,29,.65) 0%, rgba(6,35,29,.25) 60%, rgba(6,35,29,.1) 100%), url(/landing-hero.jpg), linear-gradient(135deg, #0f766e 0%, #134e4a 55%, #06231d 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center 30%",
};

// auth : 주소가 /login 이면 "login", /signup 이면 "signup" → 랜딩 위에 로그인/회원가입 창을 띄운다
// login : 로그인한 UserDto 를 App.jsx 로 넘긴다
// home : 로그인 상태면 역할별 첫 화면 경로(/admin 등), 비로그인이면 null. logout : 로그아웃
export default function Landing({ auth, login, home, logout }) {
  const navigate = useNavigate();
  const applyTo = home || "/login";
  const closeAuth = useCallback(() => navigate("/"), [navigate]);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <SiteHeader home={home} logout={logout} />

      {/* 메인 히어로 */}
      <section className="relative overflow-hidden" style={heroBackground}>
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1400px] flex-col justify-center px-6 pb-36 pt-20 lg:min-h-[calc(100vh-6rem)] lg:px-24">
          <h1 className="font-display text-5xl font-extrabold leading-[1.2] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,.35)] sm:text-6xl lg:text-7xl">
            온케어<br />방문요양 서비스
          </h1>
          <div className="mt-10 h-[3px] w-32 bg-white/80" />
          <div className="mt-10 space-y-3 text-base font-semibold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.4)] sm:text-lg">
            <p>누구보다 부모님을 더 잘 아는</p>
            <p>믿을 수 있는 재가 방문요양 전문 서비스 온케어</p>
            <p>효, 저희가 더 스마트하게 실천하겠습니다.</p>
          </div>
          <Link
            to={applyTo}
            className="mt-14 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            서비스 신청하기 <span aria-hidden>→</span>
          </Link>
        </div>
        {/* 하단 사선 */}
        <svg className="absolute bottom-0 left-0 h-20 w-full lg:h-28" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
          <polygon points="0,10 100,0 100,10" fill="#ffffff" />
        </svg>
      </section>

      {auth && <AuthModal mode={auth} onModeChange={(mode) => navigate(`/${mode}`, { replace: true })} onClose={closeAuth} login={login} />}
    </div>
  );
}
