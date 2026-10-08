import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AppMark from "../../components/common/AppMark";
import Badge from "../../components/common/Badge";
import Panel from "../../components/common/Panel";
import LoadStatus from "../../components/common/LoadStatus";
import CaregiverHome from "./home/CaregiverHome";
import CaregiverAvailability from "./availability/CaregiverAvailability";
import CaregiverSchedule from "./schedule/CaregiverSchedule";
import CaregiverRecords from "./records/CaregiverRecords";
import CaregiverProfile from "./profile/CaregiverProfile";

const caregiverNav = [
  { id: "", label: "홈", icon: "▣" },
  { id: "availability", label: "가용시간", icon: "＋" },
  { id: "schedule", label: "방문 일정", icon: "▤" },
  { id: "records", label: "업무 기록", icon: "☷" },
  { id: "profile", label: "내 정보", icon: "◉" },
];

// 요양보호사 포털 : 화면 간에 공유하는 내 정보(요양보호사)와 소속 센터를 여기서 조회하고,
// 각 화면(일정·가용시간·기록)은 자기 데이터를 직접 axios 로 조회한다.
export default function CaregiverApp({ careworkerNo, user, logout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const page = pathname.split("/")[2] || "";
  const go = (id) => navigate(id ? `/caregiver/${id}` : "/caregiver");
  const [careworker, setCareworker] = useState(null);
  const [center, setCenter] = useState(null);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [pendingCount, setPendingCount] = useState(0); // 수락 대기 배정 건수 (0 이면 표시 없음)

  // 내 정보 + 소속 센터 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadCareworker() {
    setLoadError(null);
    try {
      const [detailRes, centersRes] = await Promise.all([
        axios.get("http://localhost:8080/api/careworkers/detail", { params: { careworkerNo }, withCredentials: true }),
        axios.get("http://localhost:8080/center", { withCredentials: true }),
      ]);
      setCareworker(detailRes.data || null);
      setCenter(centersRes.data.find((c) => c.centerNo === detailRes.data?.centerNo) ?? null);
      setStatus("ok");
      return true;
    } catch (error) {
      console.error("요양보호사 정보 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
      return false;
    }
  }
  useEffect(() => { if (careworkerNo > 0) loadCareworker(); }, [careworkerNo]);

  // 수락 대기 배정 건수 : 내 근무기록 중 상태가 '배정'(관리자가 지정, 아직 수락 전)인 것의 수
  async function loadPendingCount() {
    try {
      const response = await axios.get("http://localhost:8080/careworkerreport/careworker", { params: { careworker_no: careworkerNo }, withCredentials: true });
      setPendingCount(response.data.filter((r) => r.workStatus === "배정").length);
    } catch (error) {
      setPendingCount(0);
    }
  }
  // 처음 열 때 한 번, 이후 30초마다 다시 확인해서 새 배정이 들어오면 바로 표시한다
  useEffect(() => {
    if (!(careworkerNo > 0)) return;
    loadPendingCount();
    const timer = setInterval(loadPendingCount, 30000);
    return () => clearInterval(timer);
  }, [careworkerNo]);

  // 요양보호사 계정인데 연결된 요양보호사 정보가 없는 경우 (App.jsx 에서 0 으로 전달)
  if (!careworkerNo) return (
    <div className="grid min-h-screen place-items-center bg-[#f4f8f7] p-5">
      <Panel className="max-w-md p-6 text-center">
        <p className="text-sm text-slate-600">계정에 연결된 요양보호사 정보가 없습니다. 소속 센터에 문의해주세요.</p>
        <button onClick={logout} className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">로그아웃</button>
      </Panel>
    </div>
  );

  const content = status !== "ok" || !careworker ? <LoadStatus status={status} onRetry={loadCareworker} error={loadError} /> : (
    <Routes>
      <Route index element={<CaregiverHome careworker={careworker} center={center} go={go} />} />
      <Route path="availability" element={<CaregiverAvailability careworkerNo={careworkerNo} />} />
      <Route path="schedule" element={<CaregiverSchedule careworkerNo={careworkerNo} onChanged={loadPendingCount} />} />
      <Route path="records" element={<CaregiverRecords careworkerNo={careworkerNo} />} />
      <Route path="profile" element={<CaregiverProfile careworker={careworker} center={center} user={user} onChanged={loadCareworker} />} />
      <Route path="*" element={<Navigate to="/caregiver" replace />} />
    </Routes>
  );

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-700">
      <aside className="fixed inset-y-0 z-20 hidden w-60 flex-col bg-[#07231d] p-4 text-slate-300 lg:flex">
        <div className="flex items-center gap-3 px-2 py-3"><AppMark /><div><b className="font-display text-lg text-white">온케어 스케줄</b><p className="font-mono text-[9px] tracking-widest text-teal-300">CAREGIVER PORTAL</p></div></div>
        <div className="mt-6 px-2 font-mono text-[10px] tracking-[.16em] text-slate-500">MENU</div>
        <nav className="mt-3 space-y-1" aria-label="요양보호사 메뉴">
          {caregiverNav.map((item) => <button key={item.id} onClick={() => go(item.id)} aria-current={page === item.id ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${page === item.id ? "bg-teal-600 text-white shadow-lg shadow-teal-950/30" : "hover:bg-white/5 hover:text-white"}`}><span className="w-4 text-center text-base">{item.icon}</span>{item.label}{item.id === "schedule" && pendingCount > 0 && <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">✓ {pendingCount}</span>}</button>)}
        </nav>
        <div className="mt-auto rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-semibold text-white">{careworker?.careworkerName ?? "요양보호사"}</p>
          <p className="mt-1 text-xs text-slate-400">{center?.centerName ?? "소속 센터 확인 중"}</p>
          <button onClick={logout} className="mt-3 w-full rounded-lg border border-white/20 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10">로그아웃</button>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2"><span className="lg:hidden"><AppMark size="h-8 w-8 text-sm" /></span><b className="text-sm text-slate-700">요양보호사 포털</b></div>
          <div className="flex items-center gap-2"><Badge tone={careworker?.careworkerState === "근무중" ? "ok" : "neutral"}>{careworker?.careworkerState ?? "상태 확인 중"}</Badge><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 lg:hidden">로그아웃</button></div>
        </header>
        <main className="mx-auto max-w-[1400px] p-5 pb-24 lg:p-8">
          {content}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-slate-200 bg-white/95 px-1 py-2 backdrop-blur lg:hidden" aria-label="모바일 요양보호사 메뉴">
          {caregiverNav.map((item) => <button key={item.id} onClick={() => go(item.id)} aria-current={page === item.id ? "page" : undefined} className={`relative grid flex-1 place-items-center gap-1 rounded-lg py-1 text-[10px] font-semibold ${page === item.id ? "text-teal-600" : "text-slate-400"}`}><span className="text-base leading-none">{item.icon}</span>{item.label}{item.id === "schedule" && pendingCount > 0 && <span className="absolute right-3 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">✓{pendingCount}</span>}</button>)}
        </nav>
      </div>
    </div>
  );
}
