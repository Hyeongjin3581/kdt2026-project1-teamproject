//
import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import AppMark from "../../components/common/AppMark";
import SiteHeader, { PHONE } from "./SiteHeader";

// 방문요양 하위 페이지 탭
const TABS = [
  { label: "서비스 안내", to: "/service" },
  { label: "이용 절차", to: "/process" },
];

// 서비스 안내 · 이용 절차 페이지 공용 틀 : 헤더 → 상단 배너 → 탭 → 본문 → 상담 안내 → 푸터
// home, logout : SiteHeader 로 그대로 넘긴다. eyebrow · title · desc : 상단 배너 문구
export default function SitePage({ home, logout, eyebrow, title, desc, children }) {
  const { pathname } = useLocation();
  const applyTo = home || "/login";

  // 페이지가 바뀌면 맨 위로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white text-slate-700">
      <SiteHeader home={home} logout={logout} />

      {/* 상단 배너 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-[#06231d]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="relative mx-auto max-w-[1200px] px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold text-teal-100/80">
            <Link to="/" className="hover:text-white">홈</Link> <span className="mx-1.5">›</span> 방문요양 <span className="mx-1.5">›</span> <span className="text-white">{title}</span>
          </p>
          <p className="mt-6 font-mono text-xs font-bold tracking-[.22em] text-emerald-300">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold text-white lg:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-teal-50/90">{desc}</p>
        </div>
      </section>

      {/* 서비스 안내 / 이용 절차 탭 */}
      <div className="sticky top-20 z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:top-24">
        <div className="mx-auto flex max-w-[1200px] gap-1 px-6">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => `border-b-2 px-4 py-4 text-sm font-bold transition ${isActive ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{t.label}</NavLink>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-6 py-16 lg:py-20">{children}</main>

      {/* 상담 안내 */}
      <section className="px-6 pb-20">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-500 px-8 py-10 text-white shadow-lg md:flex-row md:items-center lg:px-12">
          <div>
            <h2 className="font-display text-2xl font-extrabold lg:text-3xl">부모님 돌봄, 혼자 고민하지 마세요</h2>
            <p className="mt-2 text-sm text-teal-50/90 lg:text-base">상담부터 첫 방문까지, 온케어가 처음부터 끝까지 함께합니다.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <a href={`tel:${PHONE}`} className="rounded-xl border border-white/60 px-5 py-3 text-sm font-bold transition hover:bg-white/10">☎ {PHONE}</a>
            <Link to={applyTo} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-700 shadow-sm transition hover:bg-teal-50">서비스 신청하기 →</Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-10 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <AppMark />
            <div>
              <p className="font-bold text-slate-700">온케어 방문요양서비스</p>
              <p className="text-xs">대표전화 {PHONE}</p>
            </div>
          </div>
          <p className="text-xs">© 2026 ONCARE. 재가 방문요양 운영 시스템</p>
        </div>
      </footer>
    </div>
  );
}
