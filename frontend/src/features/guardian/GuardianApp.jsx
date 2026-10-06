//
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AppMark from "../../components/common/AppMark";
import Badge from "../../components/common/Badge";
import AccountModal from "../../components/common/AccountModal";
import LoadStatus from "../../components/common/LoadStatus";
import { toRecipient } from "../../utils/guardianAdapters";
import { TODAY } from "../../constants";
import GuardianHome from "./home/GuardianHome";
import GuardianApply from "./apply/GuardianApply";
import GuardianSchedule from "./schedule/GuardianSchedule";
import GuardianRecords from "./records/GuardianRecords";
import GuardianRequest from "./request/GuardianRequest";
import GuardianRecipient from "./recipient/GuardianRecipient";

const guardianNav = [
  { id: "home", label: "홈", short: "홈", icon: "▣" },
  { id: "apply", label: "서비스 신청", short: "신청", icon: "＋" },
  { id: "schedule", label: "방문 일정", short: "일정", icon: "▤" },
  { id: "records", label: "방문 기록", short: "기록", icon: "☷" },
  { id: "request", label: "요청 · 문의", short: "요청", icon: "✎" },
];

export default function GuardianApp({ logout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // /guardian/home → home, /guardian/apply → apply ...
  const page = pathname.split("/")[2] || "home";
  const setPage = (id) => navigate(`/guardian/${id}`);
  const [accountOpen, setAccountOpen] = useState(false);
  const [guardian, setGuardian] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [status, setStatus] = useState("loading");

  // 보호자 정보와 그 보호자의 수급자 목록을 axios로 조회
  // (로그인 API 연동 전이라 GET /guardian 의 첫 번째 보호자를 로그인한 보호자로 사용)
  async function loadRecipients() {
    try {
      const [guardiansRes, recipientsRes] = await Promise.all([
        axios.get("http://localhost:8080/guardian", { withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }),
      ]);
      const me = guardiansRes.data[0] ?? null;
      const mine = me ? recipientsRes.data.filter((r) => r.guardianNo === me.guardianNo).map(toRecipient) : [];
      setGuardian(me);
      setRecipients(mine);
      setActiveRecipientId((current) => mine.find((r) => r.id === current)?.id ?? mine[0]?.id ?? null);
      setStatus("ok");
      return mine;
    } catch (error) {
      console.error("보호자 정보 조회 실패:", error);
      setStatus("error");
      return [];
    }
  }
  useEffect(() => { loadRecipients(); }, []);
  const [activeRecipientId, setActiveRecipientId] = useState(null);
  const activeRecipient = recipients.find((recipient) => recipient.id === activeRecipientId) ?? recipients[0];

  const content = status !== "ok" ? <LoadStatus status={status} onRetry={loadRecipients} /> : (
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<GuardianHome go={setPage} guardianName={guardian?.guardianName ?? ""} onRecipientChanged={loadRecipients} recipients={recipients} activeRecipientId={activeRecipient?.id} onSelectRecipient={setActiveRecipientId} />} />
      <Route path="apply" element={<GuardianApply recipient={activeRecipient} recipients={recipients} onSelectRecipient={setActiveRecipientId} onDone={() => setPage("home")} onRegisterRecipient={() => setPage("recipient")} />} />
      <Route path="schedule" element={<GuardianSchedule recipient={activeRecipient} />} />
      <Route path="records" element={<GuardianRecords recipient={activeRecipient} />} />
      <Route path="recipient" element={<GuardianRecipient guardianNo={guardian?.guardianNo} onComplete={async () => { const list = await loadRecipients(); setActiveRecipientId(list.at(-1)?.id ?? null); setPage("home"); }} onCancel={() => setPage("home")} />} />
      <Route path="request" element={<GuardianRequest guardian={guardian} recipients={recipients} activeRecipientId={activeRecipient?.id} onSelectRecipient={setActiveRecipientId} />} />
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );

  return (
    <div className="min-h-screen bg-[#f4f8f7]">
      <aside className="fixed inset-y-0 z-20 hidden w-60 flex-col bg-[#07231d] p-4 text-slate-300 lg:flex">
        <div className="flex items-center gap-3 px-2 py-3"><AppMark /><div><b className="font-display text-lg text-white">온케어 스케줄</b><p className="font-mono text-[9px] tracking-widest text-teal-300">GUARDIAN PORTAL</p></div></div>
        <div className="mt-6 px-2 font-mono text-[10px] tracking-[.16em] text-slate-500">MENU</div>
        <nav className="mt-3 space-y-1">
          {guardianNav.map((n) => (
            <button key={n.id} onClick={() => setPage(n.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${page === n.id ? "bg-teal-600 text-white shadow-lg shadow-teal-950/30" : "hover:bg-white/5 hover:text-white"}`}>
              <span className="w-4 text-center text-base">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white">{(guardian?.guardianName ?? "보")[0]}</div>
            <div><p className="text-xs font-semibold text-white">{guardian?.guardianName ?? "-"} 보호자</p><p className="text-[11px] text-slate-400">{activeRecipient ? `${activeRecipient.name} 어르신 보호자` : "돌봄 어르신 등록 전"}</p></div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setAccountOpen(true)} className="flex-1 rounded-lg border border-white/20 py-1.5 text-[11px] font-semibold text-teal-200 transition hover:bg-white/10 hover:text-white">계정 관리</button>
            <button onClick={logout} className="flex-1 rounded-lg border border-white/10 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">로그아웃</button>
          </div>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden"><AppMark size="h-8 w-8 text-sm" /><b className="font-display text-slate-900">온케어</b></div>
          <p className="hidden text-xs text-slate-500 lg:block">{TODAY} · <b className="text-slate-700">보호자 포털</b></p>
          <div className="flex items-center gap-3">
            <Badge tone="ok">돌봄 중</Badge>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{(guardian?.guardianName ?? "보")[0]}</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-5 lg:p-8">{content}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-slate-200 bg-white/95 px-1 py-1.5 backdrop-blur lg:hidden">
          {guardianNav.map((n) => (
            <button key={n.id} onClick={() => setPage(n.id)} className={`grid flex-1 place-items-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] font-semibold ${page === n.id ? "text-teal-600" : "text-slate-400"}`}>
              <span className="text-base leading-none">{n.icon}</span><span className="w-full truncate text-center">{n.short}</span>
            </button>
          ))}
        </nav>
        <div className="h-14 lg:hidden" />
      </div>
      {accountOpen && <AccountModal guardian={guardian} recipients={recipients} onClose={() => setAccountOpen(false)} onLogout={logout} onChanged={loadRecipients} />}
    </div>
  );
}
