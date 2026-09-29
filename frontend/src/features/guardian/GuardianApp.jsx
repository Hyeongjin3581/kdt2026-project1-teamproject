import { useState } from "react";
import AppMark from "../../components/common/AppMark";
import Badge from "../../components/common/Badge";
import AccountModal from "../../components/common/AccountModal";
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
  const [page, setPage] = useState("home");
  const [accountOpen, setAccountOpen] = useState(false);
  const [recipients, setRecipients] = useState([
    { id: 1, name: "김순자", age: "78", address: "안산시 상록구 본오동", gender: "female", significant: "" },
    { id: 2, name: "김순대", age: "81", address: "안산시 단원구 고잔동", gender: "male", significant: "" },
  ]);
  const [activeRecipientId, setActiveRecipientId] = useState(1);
  const activeRecipient = recipients.find((recipient) => recipient.id === activeRecipientId) ?? recipients[0];

  const content =
    page === "home" ? <GuardianHome go={setPage} recipients={recipients} activeRecipientId={activeRecipient?.id} onSelectRecipient={setActiveRecipientId} /> :
    page === "apply" ? <GuardianApply recipient={activeRecipient} recipients={recipients} onSelectRecipient={setActiveRecipientId} onDone={() => setPage("home")} onRegisterRecipient={() => setPage("recipient")} /> :
    page === "schedule" ? <GuardianSchedule /> :
    page === "records" ? <GuardianRecords /> :
    page === "recipient" ? <GuardianRecipient onComplete={(newRecipient) => { const recipient = { ...newRecipient, id: Date.now() }; setRecipients((current) => [...current, recipient]); setActiveRecipientId(recipient.id); setPage("home"); }} onCancel={() => setPage("home")} /> :
    <GuardianRequest recipients={recipients} activeRecipientId={activeRecipient?.id} onSelectRecipient={setActiveRecipientId} />;

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
            <div className="grid h-8 w-8 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white">이</div>
            <div><p className="text-xs font-semibold text-white">이수현 보호자</p><p className="text-[11px] text-slate-400">{activeRecipient ? `${activeRecipient.name} 어르신 보호자` : "돌봄 어르신 등록 전"}</p></div>
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
            <div className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">이</div>
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
      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} onLogout={logout} />}
    </div>
  );
}
