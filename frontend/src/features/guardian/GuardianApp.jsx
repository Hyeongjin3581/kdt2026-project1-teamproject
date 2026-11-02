import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Badge from "../../components/common/Badge";
import AccountModal from "../../components/common/AccountModal";
import LoadStatus from "../../components/common/LoadStatus";
import PortalLayout from "../../components/common/PortalLayout";
import { toRecipient } from "../../utils/guardianAdapters";
import GuardianHome from "./home/GuardianHome";
import GuardianApply from "./apply/GuardianApply";
import GuardianSchedule from "./schedule/GuardianSchedule";
import GuardianRecords from "./records/GuardianRecords";
import GuardianRequest from "./request/GuardianRequest";
import GuardianRecipient from "./recipient/GuardianRecipient";

const guardianNav = [
  { id: "home", label: "홈" },
  { id: "apply", label: "서비스 신청" },
  { id: "schedule", label: "방문 일정" },
  { id: "records", label: "방문 기록" },
  { id: "request", label: "요청 · 문의" },
];

export default function GuardianApp({ user, logout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // /guardian/home → home, /guardian/apply → apply ...
  const page = pathname.split("/")[2] || "home";
  const setPage = (id) => navigate(`/guardian/${id}`);
  const [accountOpen, setAccountOpen] = useState(false);
  const [guardian, setGuardian] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);

  // 보호자 정보와 그 보호자의 수급자 목록을 axios로 조회
  // 로그인한 사용자(user.userNo)와 같은 userNo 를 가진 보호자를 찾는다. 보호자 정보가 아직 없으면 null
  async function loadRecipients() {
    setStatus("loading");
    setLoadError(null);
    try {
      const [guardiansRes, recipientsRes] = await Promise.all([
        axios.get("http://localhost:8080/guardian", { withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }),
      ]);
      const me = guardiansRes.data.find((g) => g.userNo === user?.userNo) ?? null;
      const mine = me ? recipientsRes.data.filter((r) => r.guardianNo === me.guardianNo).map(toRecipient) : [];
      setGuardian(me);
      setRecipients(mine);
      setActiveRecipientId((current) => mine.find((r) => r.id === current)?.id ?? mine[0]?.id ?? null);
      setStatus("ok");
      return mine;
    } catch (error) {
      console.error("보호자 정보 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
      return [];
    }
  }
  useEffect(() => { loadRecipients(); }, []);
  const [activeRecipientId, setActiveRecipientId] = useState(null);
  const activeRecipient = recipients.find((recipient) => recipient.id === activeRecipientId) ?? recipients[0];

  const content = status !== "ok" ? <LoadStatus status={status} onRetry={loadRecipients} /> : !guardian ? (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h2 className="font-display text-lg font-bold text-slate-900">보호자 정보가 아직 등록되지 않았습니다</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">{user?.userId} 계정으로 로그인했지만 연결된 보호자 정보가 없습니다. 센터 관리자에게 보호자 등록을 요청해주세요.</p>
    </div>
  ) : (
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<GuardianHome go={setPage} guardianName={guardian?.guardianName ?? ""} onRecipientChanged={loadRecipients} recipients={recipients} activeRecipientId={activeRecipient?.id} onSelectRecipient={setActiveRecipientId} />} />
      <Route path="apply" element={<GuardianApply recipient={activeRecipient} recipients={recipients} onSelectRecipient={setActiveRecipientId} onDone={() => setPage("home")} onRegisterRecipient={() => setPage("recipient")} />} />
      <Route path="schedule" element={<GuardianSchedule recipient={activeRecipient} />} />
      <Route path="records" element={<GuardianRecords key={activeRecipient?.id ?? "none"} recipient={activeRecipient} recipients={recipients} onSelectRecipient={setActiveRecipientId} />} />
      <Route path="recipient" element={<GuardianRecipient guardianNo={guardian?.guardianNo} onComplete={async () => { const list = await loadRecipients(); setActiveRecipientId(list.at(-1)?.id ?? null); setPage("home"); }} onCancel={() => setPage("home")} />} />
      <Route path="request" element={<GuardianRequest guardian={guardian} recipients={recipients} activeRecipientId={activeRecipient?.id} onSelectRecipient={setActiveRecipientId} />} />
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );

  return (
    <PortalLayout
      portal="보호자"
      eyebrow="GUARDIAN PORTAL"
      nav={guardianNav}
      page={page}
      onNavigate={setPage}
      userName={guardian?.guardianName ? `${guardian.guardianName} 보호자` : ""}
      userSub={activeRecipient ? `${activeRecipient.name} 어르신 보호자` : "돌봄 어르신 등록 전"}
      greeting={guardian?.guardianName ? `${guardian.guardianName} 보호자님, 안녕하세요` : "보호자님, 안녕하세요"}
      status={<Badge tone="ok">돌봄 중</Badge>}
      actions={<button type="button" onClick={() => setAccountOpen(true)} className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-100 lg:text-sm">계정 관리</button>}
      logout={logout}
    >
      {content}
      {accountOpen && <AccountModal guardian={guardian} recipients={recipients} onClose={() => setAccountOpen(false)} onLogout={logout} onChanged={loadRecipients} />}
    </PortalLayout>
  );
}
