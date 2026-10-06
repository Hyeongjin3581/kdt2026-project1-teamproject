import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AppMark from "../../components/common/AppMark";
import CenterSelect from "../../components/common/CenterSelect";
import { TODAY } from "../../constants";
import { CenterCtx } from "../../context/CenterContext";
import { buildCenters } from "../../utils/adminAdapters";

const adminNav = [
  { id: "dashboard", label: "대시보드", short: "대시보드", icon: "▦" },
  { id: "recipients", label: "수급자 관리", short: "수급자", icon: "♡" },
  { id: "guardians", label: "보호자 관리", short: "보호자", icon: "◍" },
  { id: "caregivers", label: "요양보호사 관리", short: "보호사", icon: "☺" },
  { id: "schedule", label: "방문 일정", short: "일정", icon: "▤" },
  { id: "requests", label: "요청 관리", short: "요청", icon: "✦" },
  { id: "vacancy", label: "결원 관리", short: "결원", icon: "↺" },
  { id: "inquiries", label: "문의 관리", short: "문의", icon: "✉" },
  { id: "centers", label: "센터 관리", short: "센터", icon: "⌂" },
];

export default function AdminApp({ logout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // /admin → dashboard, /admin/recipients → recipients ...
  const page = pathname.split("/")[2] || "dashboard";
  const setPage = (id) => navigate(id === "dashboard" ? "/admin" : `/admin/${id}`);
  const [center, setCenter] = useState("all");
  const [centers, setCenters] = useState(buildCenters([]));

  // 센터 선택 드롭다운과 센터명 표시를 위해 센터 목록을 axios로 조회
  useEffect(() => {
    async function loadCenters() {
      try {
        const response = await axios.get("/center", { withCredentials: true });
        setCenters(buildCenters(response.data));
      } catch (error) {
        console.error("센터 조회 실패:", error);
      }
    }
    loadCenters();
  }, [pathname]);
  const centerName = (id) => centers.find((c) => c.id === id)?.name ?? "전체 센터";
  const content = <Outlet />;
  return (
    <CenterCtx.Provider value={center}>
    <div className="min-h-screen bg-[#f4f8f7]">
      <aside className="fixed inset-y-0 z-20 hidden w-64 flex-col bg-[#07231d] p-4 text-slate-300 lg:flex">
        <div className="flex items-center gap-3 px-2 py-3"><AppMark /><div><b className="font-display text-lg text-white">온케어 스케줄</b><p className="font-mono text-[9px] tracking-widest text-teal-300">HOME CARE OPS</p></div></div>
        <div className="mt-6 px-1">
          <p className="mb-1.5 px-1 font-mono text-[10px] tracking-[.16em] text-slate-500">센터 선택</p>
          <CenterSelect centers={centers} center={center} setCenter={setCenter} dark />
        </div>
        <div className="mt-6 px-2 font-mono text-[10px] tracking-[.16em] text-slate-500">WORKSPACE</div>
        <nav className="mt-3 space-y-1">
          {adminNav.map((n) => (
            <button key={n.id} onClick={() => setPage(n.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${page === n.id ? "bg-teal-600 text-white shadow-lg shadow-teal-950/30" : "hover:bg-white/5 hover:text-white"}`}>
              <span className="w-4 text-center text-base">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold text-white">{centerName(center)}</p>
          <p className="mt-1 text-[11px] text-slate-400">관리자</p>
          <button onClick={logout} className="mt-3 text-xs text-teal-300 transition hover:text-white">로그아웃 →</button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden"><AppMark size="h-8 w-8 text-sm" /><b className="font-display text-slate-900">온케어</b></div>
          <p className="hidden text-xs text-slate-500 lg:block">{TODAY} · <b className="text-slate-700">{centerName(center)}</b></p>
          <div className="flex items-center gap-3">
            <div className="w-40 lg:hidden"><CenterSelect centers={centers} center={center} setCenter={setCenter} /></div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">관</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-5 lg:p-8">{content}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-slate-200 bg-white/95 px-1 py-1.5 backdrop-blur lg:hidden">
          {adminNav.map((n) => (
            <button key={n.id} onClick={() => setPage(n.id)} className={`grid flex-1 place-items-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] font-semibold ${page === n.id ? "text-teal-600" : "text-slate-400"}`}><span className="text-base leading-none">{n.icon}</span><span className="w-full truncate text-center">{n.short}</span></button>
          ))}
        </nav>
        <div className="h-14 lg:hidden" />
      </div>
    </div>
    </CenterCtx.Provider>
  );
}
