import { useState } from "react";
import AppMark from "../../components/common/AppMark";
import { roleMeta } from "./roleMeta";

export default function Login({ login, toSignup }) {
  const [role, setRole] = useState("admin");
  const meta = roleMeta[role];
  return (
    <main className="grid min-h-screen place-items-center bg-[#06231d] p-5 text-white">
      <div className="w-full max-w-[960px] overflow-hidden rounded-2xl bg-white shadow-2xl md:grid md:grid-cols-[1.05fr_.95fr]">
        <div className="hidden min-h-[560px] flex-col justify-between bg-gradient-to-br from-teal-600 to-emerald-800 p-10 md:flex">
          <div className="flex items-center gap-3"><AppMark /><span className="font-display text-xl font-bold">온케어 스케줄</span></div>
          <div>
            <p className="font-mono text-xs tracking-[.22em] text-teal-100">HOME-VISIT CARE OPERATIONS</p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">방문 일정을<br />조건에 맞게, 공정하게.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-teal-50/90">이용자의 방문 시간, 요양보호사의 근무 가능 시간과 담당 이력을 반영해 배정 초안을 만들고 관리자가 확정합니다.</p>
          </div>
          <p className="text-xs text-teal-100/80">ONCARE · 재가 방문요양 운영 시스템</p>
        </div>
        <div className="p-7 sm:p-11">
          <div className="mb-8 flex items-center gap-2 text-slate-900 md:hidden"><AppMark /><b className="font-display text-xl">온케어 스케줄</b></div>
          <p className="font-mono text-[11px] font-bold tracking-[.15em] text-teal-600">SIGN IN</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-900">방문요양 일정 관리 시스템</h2>
          <p className="mt-2 text-sm text-slate-500">로그인할 계정 유형을 선택하세요.</p>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            {Object.keys(roleMeta).map((r) => (
              <button key={r} onClick={() => setRole(r)} className={`rounded-lg px-2 py-2.5 text-center transition ${role === r ? "bg-white shadow-sm" : "hover:bg-white/50"}`}>
                <span className={`block text-sm font-bold ${role === r ? "text-teal-700" : "text-slate-500"}`}>{roleMeta[r].label.split(" / ")[0]}</span>
                <span className={`mt-0.5 block text-[11px] ${role === r ? "text-slate-500" : "text-slate-400"}`}>{roleMeta[r].sub}</span>
              </button>
            ))}
          </div>
          <label className="mt-6 block text-xs font-semibold text-slate-600">아이디</label>
          <input key={role + "-id"} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" placeholder="아이디 입력" />
          <label className="mt-5 block text-xs font-semibold text-slate-600">비밀번호</label>
          <input className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" type="password" placeholder="비밀번호 입력" />
          <button onClick={() => login(role)} className="mt-7 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700">{meta.cta}</button>
          <p className="mt-4 text-center text-[11px] text-slate-400">{meta.note}</p>
          <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">아직 계정이 없으신가요? <button onClick={toSignup} className="font-bold text-teal-600 hover:underline">회원가입</button></div>
        </div>
      </div>
    </main>
  );
}
