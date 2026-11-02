import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Badge from "../../components/common/Badge";
import Panel from "../../components/common/Panel";
import LoadStatus from "../../components/common/LoadStatus";
import PortalLayout from "../../components/common/PortalLayout";
import CaregiverHome from "./home/CaregiverHome";
import CaregiverAvailability from "./availability/CaregiverAvailability";
import CaregiverSchedule from "./schedule/CaregiverSchedule";
import CaregiverRecords from "./records/CaregiverRecords";
import CaregiverProfile from "./profile/CaregiverProfile";

const caregiverNav = [
  { id: "home", label: "홈" },
  { id: "availability", label: "가용시간" },
  { id: "schedule", label: "방문 일정" },
  { id: "records", label: "업무 기록" },
  { id: "profile", label: "내 정보" },
];

// 요양보호사 포털 : 화면 간에 공유하는 내 정보(요양보호사)와 소속 센터를 여기서 조회하고,
// 각 화면(일정·가용시간·기록)은 자기 데이터를 직접 axios 로 조회한다.
export default function CaregiverApp({ careworkerNo, user, logout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // /careworker/home → home, /careworker/schedule → schedule ...
  const page = pathname.split("/")[2] || "home";
  const go = (id) => navigate(`/careworker/${id}`);
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
      const response = await axios.get("http://localhost:8080/careworkerreport/careworker", { params: { careworkerNo: careworkerNo }, withCredentials: true });
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
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<CaregiverHome careworker={careworker} center={center} go={go} />} />
      <Route path="availability" element={<CaregiverAvailability careworkerNo={careworkerNo} />} />
      <Route path="schedule" element={<CaregiverSchedule careworkerNo={careworkerNo} onChanged={loadPendingCount} />} />
      <Route path="records" element={<CaregiverRecords careworkerNo={careworkerNo} />} />
      <Route path="profile" element={<CaregiverProfile careworker={careworker} center={center} user={user} onChanged={loadCareworker} />} />
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );

  return (
    <PortalLayout
      portal="요양보호사"
      eyebrow="CAREGIVER PORTAL"
      nav={caregiverNav.map((item) => item.id === "schedule" ? { ...item, badge: pendingCount } : item)}   // 방문 일정 : 수락 대기 배정 건수 표시
      page={page}
      onNavigate={go}
      userName={careworker?.careworkerName ?? "요양보호사"}
      userSub={center?.centerName ?? "소속 센터 확인 중"}
      greeting={careworker?.careworkerName ? `${careworker.careworkerName} 요양보호사님, 오늘도 함께해요` : "요양보호사님, 오늘도 함께해요"}
      status={<Badge tone={careworker?.careworkerState === "근무중" ? "ok" : "neutral"}>{careworker?.careworkerState ?? "상태 확인 중"}</Badge>}
      logout={logout}
    >
      {content}
    </PortalLayout>
  );
}
