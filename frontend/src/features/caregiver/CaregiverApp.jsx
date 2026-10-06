import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import caregiverApi from "./caregiverApi";
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

export default function CaregiverApp({ careworkerNo, approval, logout, api = caregiverApi }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const page = pathname.split("/")[2] || "";
  const go = (id) => navigate(id ? `/caregiver/${id}` : "/caregiver");
  const [careworker, setCareworker] = useState(null);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState("loading");
  const [availabilityError, setAvailabilityError] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [center, setCenter] = useState(null);
  const [centerLoading, setCenterLoading] = useState(false);
  const [centerError, setCenterError] = useState("");

  async function loadCareworker(showLoading = true) {
    if (showLoading) setStatus("loading");
    setLoadError(null);
    try {
      const response = await api.getProfile(careworkerNo);
      setCareworker(response.data?.careworkerNo === careworkerNo ? response.data : null);
      setStatus("ok");
      return true;
    } catch (error) {
      setCareworker(null);
      setLoadError(error);
      setStatus("error");
      return false;
    }
  }

  async function loadAvailability(showLoading = true) {
    if (showLoading) setAvailabilityStatus("loading");
    setAvailabilityError(null);
    try {
      const response = await api.getAvailability();
      // 전체조회 API만 있으므로 로그인 정보에서 전달받은 요양보호사 번호로 표시 범위를 제한합니다.
      setAvailability(response.data.filter((item) => item.caregiverNo === careworkerNo).sort((a, b) => a.availableDate.localeCompare(b.availableDate) || a.startTime - b.startTime));
      setAvailabilityStatus("ok");
      return true;
    } catch (error) {
      if (showLoading) setAvailability([]);
      setAvailabilityError(error);
      if (showLoading) setAvailabilityStatus("error");
      return false;
    }
  }

  async function loadSchedule() {
    if (!api.getSchedule) return;
    setScheduleLoading(true);
    setScheduleError("");
    try {
      const response = await api.getSchedule(careworkerNo);
      if (!Array.isArray(response.data)) throw new Error("일정 응답을 확인할 수 없습니다.");
      setSchedule(response.data);
    } catch (error) {
      setScheduleError(error.response ? `방문 일정을 불러오지 못했습니다. (HTTP ${error.response.status})` : "방문 일정을 불러오지 못했습니다. 다시 시도해주세요.");
    } finally { setScheduleLoading(false); }
  }

  async function loadNotifications() {
    if (!api.getNotifications) return;
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const response = await api.getNotifications(careworkerNo);
      if (!Array.isArray(response.data)) throw new Error("알림 응답을 확인할 수 없습니다.");
      setNotifications(response.data);
    } catch {
      setNotificationsError("일정 변경 알림을 불러오지 못했습니다. 다시 시도해주세요.");
    } finally { setNotificationsLoading(false); }
  }

  async function loadRecords() {
    if (!api.getRecords) return;
    setRecordsLoading(true);
    setRecordsError("");
    try {
      const response = await api.getRecords(careworkerNo);
      if (!Array.isArray(response.data)) throw new Error("기록 응답을 확인할 수 없습니다.");
      setRecords(response.data);
    } catch (error) {
      setRecordsError(error.response ? `업무 기록을 불러오지 못했습니다. (HTTP ${error.response.status})` : "업무 기록을 불러오지 못했습니다. 다시 시도해주세요.");
    } finally { setRecordsLoading(false); }
  }

  async function saveRecord(form, recordNo) {
    if (!api.saveRecord) return false;
    const response = await api.saveRecord({ ...form, careworkerNo, recordNo });
    if (response.data !== true) return false;
    await loadRecords();
    return true;
  }

  async function loadCenter() {
    if (!api.getCenters || !careworker?.centerNo) return;
    setCenterLoading(true);
    setCenterError("");
    try {
      const response = await api.getCenters();
      if (!Array.isArray(response.data)) throw new Error("센터 응답을 확인할 수 없습니다.");
      setCenter(response.data.find((item) => item.centerNo === careworker.centerNo) ?? null);
    } catch {
      setCenterError("센터 정보를 불러오지 못했습니다.");
    } finally { setCenterLoading(false); }
  }

  useEffect(() => {
    if (!Number.isInteger(careworkerNo) || careworkerNo < 1) return;
    loadCareworker();
    loadAvailability();
    loadSchedule();
    setNotifications([]);
    setNotificationsError("");
    loadNotifications();
    loadRecords();
  }, [careworkerNo, api]);
  useEffect(() => { setCenter(null); loadCenter(); }, [careworker?.centerNo, api]);

  if (!Number.isInteger(careworkerNo) || careworkerNo < 1) return <Navigate to="/login" replace />;
  const availabilityProps = { careworkerNo, items: availability, status: availabilityStatus, error: availabilityError, onReload: loadAvailability, api };
  const scheduleProps = { items: schedule, loading: scheduleLoading, error: scheduleError, onRetry: api.getSchedule ? loadSchedule : undefined, connected: Boolean(api.getSchedule) };
  const centerProps = { item: center, loading: centerLoading, error: centerError, onRetry: loadCenter, connected: Boolean(api.getCenters) };
  const notificationProps = { items: notifications, loading: notificationsLoading, error: notificationsError, onRetry: api.getNotifications ? loadNotifications : undefined, connected: Boolean(api.getNotifications) };
  const content = status !== "ok" ? <LoadStatus status={status} onRetry={loadCareworker} error={loadError} /> : !careworker ? (
    <Panel className="p-6 text-center">
      <p className="text-sm text-slate-600">계정에 연결된 요양보호사 정보가 없습니다. 소속 센터에 문의해주세요.</p>
      <button onClick={loadCareworker} className="mt-4 text-sm font-bold text-teal-700">다시 조회</button>
    </Panel>
  ) : (
    <Routes>
      <Route index element={<CaregiverHome careworker={careworker} approval={approval} go={go} availability={availabilityProps} schedule={scheduleProps} center={centerProps} notifications={notificationProps} />} />
      <Route path="availability" element={<CaregiverAvailability {...availabilityProps} />} />
      <Route path="schedule" element={<CaregiverSchedule {...scheduleProps} />} />
      <Route path="records" element={<CaregiverRecords items={records} loading={recordsLoading} error={recordsError} onRetry={api.getRecords ? loadRecords : undefined} connected={Boolean(api.getRecords)} onSave={api.saveRecord ? saveRecord : null} />} />
      <Route path="profile" element={<CaregiverProfile careworker={careworker} approval={approval} onChanged={() => loadCareworker(false)} onLogout={logout} api={api} />} />
      <Route path="*" element={<Navigate to="/caregiver" replace />} />
    </Routes>
  );

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-700">
      <aside className="fixed inset-y-0 z-20 hidden w-60 flex-col bg-[#07231d] p-4 text-slate-300 lg:flex">
        <div className="flex items-center gap-3 px-2 py-3"><AppMark /><div><b className="font-display text-lg text-white">온케어 스케줄</b><p className="font-mono text-[9px] tracking-widest text-teal-300">CAREGIVER PORTAL</p></div></div>
        <div className="mt-6 px-2 font-mono text-[10px] tracking-[.16em] text-slate-500">MENU</div>
        <nav className="mt-3 space-y-1" aria-label="요양보호사 메뉴">
          {caregiverNav.map((item) => <button key={item.id} onClick={() => go(item.id)} aria-current={page === item.id ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${page === item.id ? "bg-teal-600 text-white shadow-lg shadow-teal-950/30" : "hover:bg-white/5 hover:text-white"}`}><span className="w-4 text-center text-base">{item.icon}</span>{item.label}</button>)}
        </nav>
        <div className="mt-auto rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-semibold text-white">{careworker?.careworkerName ?? "요양보호사"}</p>
          <p className="mt-1 text-xs text-slate-400">{center?.centerName || (careworker ? `소속 센터 번호 ${careworker.centerNo}` : "정보 조회 중")}</p>
          <button onClick={logout} className="mt-3 w-full rounded-lg border border-white/20 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10">로그아웃</button>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2"><span className="lg:hidden"><AppMark size="h-8 w-8 text-sm" /></span><b className="text-sm text-slate-700">요양보호사 포털</b></div>
          <div className="flex items-center gap-2"><Badge>{careworker?.careworkerState || "상태 미확인"}</Badge><button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 lg:hidden">로그아웃</button></div>
        </header>
        <main className="mx-auto max-w-[1400px] p-5 pb-24 lg:p-8">
          {api.isDemo && <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"><b>개발용 더미 계정으로 둘러보는 중입니다.</b><p className="text-xs">센터·개인정보·일정·기록은 예시입니다. 가용시간은 체험 중에 등록·수정·삭제할 수 있으며 실제 서버에는 저장하지 않습니다. 로그아웃하거나 브라우저를 새로고침하면 체험 변경 내용이 초기화됩니다.</p></div>}
          {content}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-slate-200 bg-white/95 px-1 py-2 backdrop-blur lg:hidden" aria-label="모바일 요양보호사 메뉴">
          {caregiverNav.map((item) => <button key={item.id} onClick={() => go(item.id)} aria-current={page === item.id ? "page" : undefined} className={`grid flex-1 place-items-center gap-1 rounded-lg py-1 text-[10px] font-semibold ${page === item.id ? "text-teal-600" : "text-slate-400"}`}><span className="text-base leading-none">{item.icon}</span>{item.label}</button>)}
        </nav>
      </div>
    </div>
  );
}
