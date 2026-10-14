//
import { Link } from "react-router-dom";
import AppMark from "./AppMark";
import { TODAY } from "../../constants";

// 보호자 · 요양보호사 포털 공용 틀 : 메인 페이지처럼 상단 메뉴 → 인사 배너 → 본문 (PC 화면 기준)
// portal : "보호자" | "요양보호사", eyebrow : 배너 위 작은 영문 문구
// nav : [{ id, label, badge? }], page : 현재 메뉴 id, onNavigate(id) : 메뉴 이동
// userName · userSub : 오른쪽 위 사용자 표시, greeting : 배너 인사말, status : 배너 오른쪽 상태 뱃지
// actions : 로그아웃 앞에 붙는 버튼 (예: 계정 관리), logout : 로그아웃
export default function PortalLayout({ portal, eyebrow, nav, page, onNavigate, userName, userSub, greeting, status, actions, logout, children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-4 px-10">
          {/* 좌측 로고 : 누르면 메인 페이지로 */}
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <AppMark size="h-11 w-11 text-xl" />
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold tracking-wide text-teal-700">온케어 방문요양서비스</p>
              <p className="text-xs font-semibold text-teal-600">{portal} 포털</p>
            </div>
          </Link>

          {/* 메뉴 */}
          <nav className="flex h-full items-stretch gap-1" aria-label={`${portal} 메뉴`}>
            {nav.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onNavigate(n.id)}
                aria-current={page === n.id ? "page" : undefined}
                className={`relative flex items-center gap-1.5 border-b-[3px] px-4 text-[15px] font-bold transition ${page === n.id ? "border-teal-600 text-teal-700" : "border-transparent text-slate-600 hover:text-teal-600"}`}
              >
                {n.label}
                {n.badge > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">{n.badge}</span>}
              </button>
            ))}
          </nav>

          {/* 우측 사용자 · 계정 버튼 */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2.5 pr-2 xl:flex">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">{(userName || portal)[0]}</div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-800">{userName || "-"}</p>
                <p className="text-[11px] text-slate-400">{userSub}</p>
              </div>
            </div>
            {actions}
            <button type="button" onClick={logout} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100">로그아웃</button>
          </div>
        </div>
      </header>

      {/* 인사 배너 */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-700 via-teal-800 to-[#06231d]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-10 py-6">
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[.22em] text-emerald-300">{eyebrow}</p>
            <p className="mt-1.5 font-display text-2xl font-extrabold text-white">{greeting}</p>
            <p className="mt-1 text-xs text-teal-100/80">{TODAY}</p>
          </div>
          {status}
        </div>
      </section>

      <main className="mx-auto max-w-[1400px] p-10">{children}</main>
    </div>
  );
}
