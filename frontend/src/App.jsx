import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./features/auth/Login";
import Signup from "./features/auth/Signup";
import AdminApp from "./features/admin/AdminApp";
import Dashboard from "./features/admin/dashboard/Dashboard";
import Recipients from "./features/admin/recipients/Recipients";
import Guardians from "./features/admin/guardians/Guardians";
import Caregivers from "./features/admin/caregivers/Caregivers";
import Schedule from "./features/admin/schedule/Schedule";
import AutoScheduling from "./features/admin/autoScheduling/AutoScheduling";
import Vacancy from "./features/admin/vacancy/Vacancy";
import Centers from "./features/admin/centers/Centers";
import Inquiries from "./features/admin/inquiries/Inquiries";
import GuardianApp from "./features/guardian/GuardianApp";
import CaregiverApp from "./features/caregiver/CaregiverApp";

function OncareApp() {
  const [role, setRole] = useState(null);
  const [caregiverNo, setCaregiverNo] = useState(null);
  const [caregiverApproval, setCaregiverApproval] = useState(null);
  const [caregiverDemoApi, setCaregiverDemoApi] = useState(null);
  // caregiver는 인증 응답의 역할·본인 번호·승인 여부를 모두 확인한 후 진입합니다.
  const login = (nextRole, careworkerNo = null, approval = null, demoApi = null) => {
    if (demoApi && !import.meta.env.DEV) return false;
    if (nextRole === "caregiver" && (!Number.isInteger(careworkerNo) || careworkerNo < 1 || approval?.approved !== true || approval?.canUse === false)) return false;
    setCaregiverNo(nextRole === "caregiver" ? careworkerNo : null);
    setCaregiverApproval(nextRole === "caregiver" ? approval : null);
    setCaregiverDemoApi(nextRole === "caregiver" ? demoApi : null);
    setRole(nextRole);
    return true;
  };
  const logout = () => { setRole(null); setCaregiverNo(null); setCaregiverApproval(null); setCaregiverDemoApi(null); };
  return (
    <Routes>
      {/* 로그인 상태면 각 역할의 첫 화면으로, 아니면 로그인/회원가입 화면 */}
      <Route path="/login" element={role ? <Navigate to={`/${role}`} replace /> : <Login login={login} />} />
      <Route path="/signup" element={role ? <Navigate to={`/${role}`} replace /> : <Signup />} />
      {/* 관리자: AdminApp이 공통 레이아웃(사이드바·헤더)이고 하위 화면은 Outlet에 렌더링 */}
      <Route path="/admin" element={role === "admin" ? <AdminApp logout={logout} /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="recipients" element={<Recipients />} />
        <Route path="guardians" element={<Guardians />} />
        <Route path="caregivers" element={<Caregivers />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="auto" element={<AutoScheduling />} />
        <Route path="vacancy" element={<Vacancy />} />
        <Route path="centers" element={<Centers />} />
        <Route path="inquiries" element={<Inquiries />} />
      </Route>
      {/* 보호자: 화면 간에 공유하는 상태(수급자 목록)가 있어 GuardianApp 안에서 하위 Routes를 정의 */}
      <Route path="/guardian/*" element={role === "guardian" ? <GuardianApp logout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="/caregiver/*" element={role === "caregiver" && caregiverNo && caregiverApproval?.approved === true && caregiverApproval?.canUse !== false ? <CaregiverApp careworkerNo={caregiverNo} approval={caregiverApproval} api={caregiverDemoApi ?? undefined} logout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  const { pathname } = useLocation();
  // 폰 프레임(iframe) 안에서 렌더될 때는 토글 UI 없이 앱만 보여줍니다 (재귀 방지).
  // 화면 이동으로 주소의 ?frame=off 가 사라져도 유지되도록 처음 한 번만 읽습니다.
  const [framed] = useState(() => new URLSearchParams(window.location.search).get("frame") === "off");
  const [mobile, setMobile] = useState(false);
  if (framed) return <OncareApp />;

  return (
    <>
      {mobile ? (
        <div className="grid min-h-screen place-items-center bg-[#06231d] p-6">
          <div className="relative">
            <div className="mx-auto h-[812px] w-[390px] overflow-hidden rounded-[44px] border-[10px] border-[#0b3128] bg-black shadow-2xl">
              <div className="absolute left-1/2 top-[10px] z-10 h-6 w-32 -translate-x-1/2 rounded-full bg-[#0b3128]" />
              <iframe title="모바일 미리보기" src="/login?frame=off" className="h-full w-full border-0 bg-white" />
            </div>
            <p className="mt-4 text-center font-mono text-[11px] tracking-widest text-teal-200/70">MOBILE PREVIEW · 390 × 812</p>
          </div>
        </div>
      ) : (
        <OncareApp />
      )}
      <button
        type="button"
        onClick={() => setMobile((v) => !v)}
        className={`fixed ${pathname.startsWith("/caregiver") ? "bottom-20 lg:bottom-5" : "bottom-5"} right-5 z-50 flex items-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/25 transition hover:bg-teal-700`}
      >
        {mobile ? (
          <><span aria-hidden>🖥️</span> 데스크톱 보기</>
        ) : (
          <><span aria-hidden>📱</span> 모바일 보기</>
        )}
      </button>
    </>
  );
}
