//
import { useState, useEffect } from "react";
import axios from "axios";
import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./features/landing/Landing";
import ServiceGuide from "./features/landing/ServiceGuide";
import UsageProcess from "./features/landing/UsageProcess";
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
import { reissueToken, setupReissueInterceptor } from "./utils/tokenReissue";

// userCategoryNo → 화면 구분 (1 보호자, 2 요양보호사, 3 센터 관리자, 4 시스템 관리자)
const roleOf = (user) => !user ? null
  : [3, 4].includes(user.userCategoryNo) ? "admin"
    : user.userCategoryNo === 1 ? "guardian"
      : user.userCategoryNo === 2 ? "caregiver"
        : null;

// 역할별 첫 화면 주소 (로그인 직후 이동, 메인 페이지의 '내 화면으로')
const ROLE_HOME = { admin: "/admin", guardian: "/guardian/home", caregiver: "/careworker/home" };

function OncareApp() {

  // 로그인한 사용자 정보 (백엔드 UserDto). 비로그인이면 null
  const [user, setUser] = useState(null);
  // /user/me 응답을 기다리는 중인지
  const [loading, setLoading] = useState(true);
  // 요양보호사로 로그인했을 때 그 사람의 요양보호사 번호 (UserDto 에는 없어서 따로 찾는다)
  const [careworkerNo, setCareworkerNo] = useState(null);

  const role = roleOf(user);
  const home = ROLE_HOME[role] ?? null;

  // 401(accessToken 만료)을 받은 요청은 토큰 재발급 후 한 번 다시 보낸다
  useEffect(() => setupReissueInterceptor(), []);

  // 앱이 처음 켜질 때(새로고침 포함) 쿠키로 로그인 상태 복원
  // accessToken(30분)이 만료돼 /user/me 가 비어 있으면, refreshToken(7일)으로 재발급(/user/reissue)해서 복원한다
  useEffect(() => {
    async function restore() {
      try {
        const me = await axios.get("http://localhost:8080/user/me", { withCredentials: true });
        setUser(me.data || await reissueToken());
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  // 로그인해 있는 동안 accessToken 이 만료되기(30분) 전에 25분마다 미리 재발급한다
  // 서버가 재발급을 거절하면(refreshToken 만료 · 다른 곳에서 다시 로그인 등) 로그아웃 상태로 돌린다. 통신 오류는 다음 주기에 다시 시도
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      reissueToken()
        .then((reissued) => {
          if (reissued) return;
          alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
          setUser(null);
        })
        .catch((e) => console.error("토큰 재발급 실패:", e));
    }, 25 * 60 * 1000);
    return () => clearInterval(timer);
  }, [user?.userNo]);

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
      {/* 메인(랜딩) 페이지 : 로그인 상태여도 보여주고, 헤더에 '내 화면으로'·'로그아웃'을 띄운다 */}
      {/* /login, /signup 은 랜딩 페이지 위에 로그인/회원가입 창을 띄운다 (관리자·보호자·요양보호사 공용 로그인) */}
      {/* 로그인하면(이미 로그인한 상태 포함) 역할별 첫 화면으로 보낸다. replace 라서 로그인 창 기록이 덮어써져, 뒤로가기를 누르면 메인(/)으로 간다 */}
      <Route path="/" element={<Landing home={home} logout={logout} />} />
      {/* 방문요양 소개 페이지 : 서비스 안내 · 이용 절차 */}
      <Route path="/service" element={<ServiceGuide home={home} logout={logout} />} />
      <Route path="/process" element={<UsageProcess home={home} logout={logout} />} />
      <Route path="/login" element={role ? <Navigate to={home} replace /> : <Landing auth="login" login={setUser} />} />
      <Route path="/signup" element={role ? <Navigate to={home} replace /> : <Landing auth="signup" login={setUser} />} />
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
      <Route path="/careworker/*" element={role !== "caregiver" ? <Navigate to="/login" replace />
        : careworkerNo === null ? <div className="grid min-h-screen place-items-center text-sm text-slate-500">요양보호사 정보를 확인하는 중...</div>
          : <CaregiverApp careworkerNo={careworkerNo} user={user} logout={logout} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <OncareApp />;
}
