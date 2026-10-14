//
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppMark from "../../components/common/AppMark";

// 대표 전화번호 (임시)
export const PHONE = "1588-0000";

// 상단 메뉴 : children 이 있으면 마우스를 올렸을 때 하위 메뉴를 보여준다. apply : '서비스 신청' (비로그인이면 로그인 창, 로그인 상태면 내 화면)
const menus = [
  { label: "서비스 신청", apply: true },
  {
    label: "방문요양",
    children: [
      { label: "서비스 안내", to: "/service" },
      { label: "이용 절차", to: "/process" },
    ],
  },
];

function Chevron() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 메인·서비스 안내·이용 절차 페이지 공용 상단 헤더
// home : 로그인 상태면 역할별 첫 화면 경로(/admin 등), 비로그인이면 null. logout : 로그아웃
export default function SiteHeader({ home, logout }) {
  const { pathname } = useLocation();
  const applyTo = home || "/login";
  // 모바일에서 메뉴 펼침 여부
  const [menuOpen, setMenuOpen] = useState(false);
  // 지금 보고 있는 페이지가 이 메뉴(또는 하위 메뉴)인지
  const isActive = (m) => m.children?.some((c) => c.to === pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 lg:h-24 lg:px-10">
        {/* 좌측 상단 로고 · 이름 · 전화번호 */}
        <Link to="/" className="flex items-center gap-3">
          <AppMark size="h-12 w-12 text-2xl" />
          <div className="leading-tight">
            <p className="font-display text-lg font-extrabold tracking-wide text-teal-700">온케어 방문요양서비스</p>
            <p className="font-mono text-base font-medium text-teal-600">{PHONE}</p>
          </div>
        </Link>

        {/* 데스크톱 메뉴 */}
        <nav className="hidden items-center gap-8 lg:flex">
          {menus.map((m) => (
            <div key={m.label} className="group relative">
              {m.apply ? (
                <Link to={applyTo} className="flex items-center gap-1 py-8 text-[15px] font-bold text-slate-700 transition hover:text-teal-600">{m.label}</Link>
              ) : (
                <button type="button" className={`flex items-center gap-1 py-8 text-[15px] font-bold transition hover:text-teal-600 ${isActive(m) ? "text-teal-600" : "text-slate-700"}`}>
                  {m.label}{m.children && <Chevron />}
                </button>
              )}
              {m.children && (
                <div className="invisible absolute left-1/2 top-full w-40 -translate-x-1/2 rounded-xl border border-slate-100 bg-white py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  {m.children.map((c) => (
                    <Link key={c.label} to={c.to} className="block px-4 py-2 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700">{c.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-6">
            {home ? <>
              <button type="button" onClick={logout} className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100">로그아웃</button>
              <Link to={home} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700">내 화면으로</Link>
            </> : <>
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100">로그인</Link>
              <Link to="/signup" className="rounded-full bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700">회원가입</Link>
            </>}
          </div>
        </nav>

        {/* 모바일 메뉴 버튼 */}
        <button type="button" onClick={() => setMenuOpen((v) => !v)} className="rounded-lg p-2 text-slate-700 lg:hidden" aria-label="메뉴">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <nav className="border-t border-slate-100 bg-white px-5 pb-5 lg:hidden">
          {menus.map((m) => (
            m.apply
              ? <Link key={m.label} to={applyTo} className="block border-b border-slate-100 py-3 text-sm font-bold text-slate-700">{m.label}</Link>
              : <div key={m.label} className="border-b border-slate-100 py-3">
                  <p className="text-sm font-bold text-slate-700">{m.label}</p>
                  {m.children?.map((c) => <Link key={c.label} to={c.to} onClick={() => setMenuOpen(false)} className="mt-2 block pl-3 text-sm text-slate-500">{c.label}</Link>)}
                </div>
          ))}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {home ? <>
              <button type="button" onClick={logout} className="rounded-xl border border-slate-200 py-2.5 text-center text-sm font-bold text-slate-700">로그아웃</button>
              <Link to={home} className="rounded-xl bg-teal-600 py-2.5 text-center text-sm font-bold text-white">내 화면으로</Link>
            </> : <>
              <Link to="/login" className="rounded-xl border border-slate-200 py-2.5 text-center text-sm font-bold text-slate-700">로그인</Link>
              <Link to="/signup" className="rounded-xl bg-teal-600 py-2.5 text-center text-sm font-bold text-white">회원가입</Link>
            </>}
          </div>
        </nav>
      )}
    </header>
  );
}
