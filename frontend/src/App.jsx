import { useState, useEffect } from "react";
import axios from "axios";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./features/auth/Login";
import Signup from "./features/auth/Signup";
import AdminApp from "./features/admin/AdminApp";
import Dashboard from "./features/admin/dashboard/Dashboard";
import Recipients from "./features/admin/recipients/Recipients";
import Guardians from "./features/admin/guardians/Guardians";
import Caregivers from "./features/admin/caregivers/Caregivers";
import Schedule from "./features/admin/schedule/Schedule";
import Requests from "./features/admin/requests/Requests";
import Vacancy from "./features/admin/vacancy/Vacancy";
import Centers from "./features/admin/centers/Centers";
import Inquiries from "./features/admin/inquiries/Inquiries";
import GuardianApp from "./features/guardian/GuardianApp";

function OncareApp() {

  // 로그인한 사용자 정보 (백엔드 UserDto). 비로그인이면 null
  const [user, setUser] = useState(null);
  // /user/me 응답을 기다리는 중인지
  const [loading, setLoading] = useState(true);

  // userCategoryNo → 화면 구분 (1 보호자, 3 센터 관리자, 4 시스템 관리자)
  const role = user
    ? ([3, 4].includes(user.userCategoryNo) ? "admin"
      : user.userCategoryNo === 1 ? "guardian"
        : null)
    : null;

  // 앱이 처음 켜질 때(새로고침 포함) 쿠키로 로그인 상태 복원
  useEffect(() => {
    axios.get("http://localhost:8080/user/me", { withCredentials: true })
      .then((res) => setUser(res.data || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // 로그아웃: 백엔드에서 Redis·쿠키 삭제 후 화면 상태 비우기
  const logout = async () => {
    try {
      await axios.post("http://localhost:8080/user/logout", {}, { withCredentials: true });
    } catch (e) {
      console.error("로그아웃 실패:", e);
    }
    setUser(null);
  };

  // 로딩중 화면
  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">로그인 확인 중...</div>;
  }
  
  
  return (
    <Routes>
      {/* 로그인 상태면 각 역할의 첫 화면으로, 아니면 로그인/회원가입 화면 */}
      <Route path="/login" element={role ? <Navigate to={`/${role}`} replace /> : <Login login={setUser} />} />   {/* <Login login={setRole} /> 에서 변경 (2026. 10. 05) */}
      <Route path="/signup" element={role ? <Navigate to={`/${role}`} replace /> : <Signup />} />
      {/* 관리자: AdminApp이 공통 레이아웃(사이드바·헤더)이고 하위 화면은 Outlet에 렌더링 */}
      <Route path="/admin" element={role === "admin" ? <AdminApp logout={logout} /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="recipients" element={<Recipients />} />
        <Route path="guardians" element={<Guardians />} />
        <Route path="caregivers" element={<Caregivers />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="requests" element={<Requests />} />
        <Route path="auto" element={<Navigate to="/admin/requests" replace />} />
        <Route path="vacancy" element={<Vacancy />} />
        <Route path="centers" element={<Centers />} />
        <Route path="inquiries" element={<Inquiries />} />
      </Route>
      {/* 보호자: 화면 간에 공유하는 상태(수급자 목록)가 있어 GuardianApp 안에서 하위 Routes를 정의 */}
      <Route path="/guardian/*" element={role === "guardian" ? <GuardianApp user={user} logout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return <OncareApp />;
}
