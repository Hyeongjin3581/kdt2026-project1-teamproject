//
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
import CaregiverApp from "./features/caregiver/CaregiverApp";
import ChatTest from "@/features/chat/ChatTest.jsx";

function OncareApp() {

  // 로그인한 사용자 정보 (백엔드 UserDto). 비로그인이면 null
  const [user, setUser] = useState(null);
  // /user/me 응답을 기다리는 중인지
  const [loading, setLoading] = useState(true);
  // 요양보호사로 로그인했을 때 그 사람의 요양보호사 번호 (UserDto 에는 없어서 따로 찾는다)
  const [careworkerNo, setCareworkerNo] = useState(null);

  // userCategoryNo → 화면 구분 (1 보호자, 2 요양보호사, 3 센터 관리자, 4 시스템 관리자)
  const role = !user ? null
    : [3, 4].includes(user.userCategoryNo) ? "admin"
      : user.userCategoryNo === 1 ? "guardian"
        : user.userCategoryNo === 2 ? "caregiver"
          : null;

  // 앱이 처음 켜질 때(새로고침 포함) 쿠키로 로그인 상태 복원
  useEffect(() => {
    axios.get("http://localhost:8080/user/me", { withCredentials: true })
      .then((res) => setUser(res.data || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // 요양보호사로 로그인하면 요양보호사 목록에서 userNo 가 같은 사람을 찾아 요양보호사 번호를 얻는다
  useEffect(() => {
    if (user?.userCategoryNo !== 2) { setCareworkerNo(null); return; }
    axios.get("http://localhost:8080/api/careworkers", { withCredentials: true })
      .then((res) => setCareworkerNo(res.data.find((c) => c.userNo === user.userNo)?.careworkerNo ?? 0)) // 0 = 연결된 요양보호사 없음
      .catch(() => setCareworkerNo(0));
  }, [user]);

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
      <Route path="/login" element={role ? <Navigate to={`/${role}`} replace /> : <Login login={setUser} />} />   {/* 관리자·보호자·요양보호사 공용 : 로그인한 UserDto 를 넘겨받는다 */}
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
      {/* 요양보호사: 요양보호사 번호를 찾는 동안(null)은 잠시 대기, 연결된 요양보호사가 없으면(0) 안내 */}
      <Route path="/caregiver/*" element={role !== "caregiver" ? <Navigate to="/login" replace />
        : careworkerNo === null ? <div className="grid min-h-screen place-items-center text-sm text-slate-500">요양보호사 정보를 확인하는 중...</div>
          : <CaregiverApp careworkerNo={careworkerNo} user={user} logout={logout} />} />
      <Route path="/chat-test" element={<ChatTest />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return <OncareApp />;
}
