import { useEffect, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import AddressField from "../../../components/common/AddressField";
import CaregiverPageTitle from "../CaregiverPageTitle";

// 내 정보 : 개인 정보(이름·주소), 연락처, 근무 정보(읽기 전용), 비밀번호 변경
export default function CaregiverProfile({ careworker, center, user, onChanged }) {
  const [name, setName] = useState(careworker.careworkerName ?? "");
  const [address, setAddress] = useState(careworker.careworkerAddress ?? "");
  const [profileMessage, setProfileMessage] = useState("");
  const [account, setAccount] = useState(null); // 로그인 계정 (UserDto)
  const [phone, setPhone] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [saving, setSaving] = useState("");     // 저장 중인 영역 : "profile" | "phone" | "password"
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const button = "rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400";

  useEffect(() => { setName(careworker.careworkerName ?? ""); setAddress(careworker.careworkerAddress ?? ""); }, [careworker]);

  // 로그인 계정 정보(연락처) : axios.get("통신할주소", { 옵션 }) → GET /user?no=회원번호
  async function loadAccount() {
    try {
      const response = await axios.get("http://localhost:8080/user", { params: { no: user.userNo }, withCredentials: true });
      setAccount(response.data);
      setPhone(response.data?.phoneNumber ?? "");
    } catch (error) {
      console.error("계정 정보 조회 실패:", error);
      setPhoneMessage("연락처를 불러오지 못했습니다.");
    }
  }
  useEffect(() => { loadAccount(); }, [user.userNo]);

  // 개인 정보 저장 : PUT /api/careworkers (요양보호사 DTO 전체를 보내므로 최신 정보를 다시 받아 이름·주소만 바꾼다)
  const saveProfile = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!name.trim() || !address.split(",")[0].trim()) { setProfileMessage("이름과 주소를 입력해주세요."); return; }
    setSaving("profile");
    setProfileMessage("");
    try {
      const latest = await axios.get("http://localhost:8080/api/careworkers/detail", { params: { careworkerNo: careworker.careworkerNo }, withCredentials: true });
      const response = await axios.put("http://localhost:8080/api/careworkers", { ...latest.data, careworkerName: name.trim(), careworkerAddress: address.trim() }, { withCredentials: true });
      if (response.data) { setProfileMessage("개인 정보를 저장했습니다."); onChanged(); }
      else setProfileMessage("개인 정보를 저장하지 못했습니다.");
    } catch (error) {
      console.error(error);
      setProfileMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setSaving("");
    }
  };

  // 연락처 저장 : PUT /user (UserDto, 비밀번호를 비워 보내면 비밀번호는 바뀌지 않음)
  const savePhone = async (event) => {
    event.preventDefault();
    if (saving || !account) return;
    if (!/^\d{9,15}$/.test(phone.replace(/\D/g, ""))) { setPhoneMessage("연락처를 확인해주세요. 숫자 9~15자리를 입력해주세요."); return; }
    setSaving("phone");
    setPhoneMessage("");
    try {
      const response = await axios.put("http://localhost:8080/user", { userNo: account.userNo, userId: account.userId, email: account.email, phoneNumber: phone.trim() }, { withCredentials: true });
      setPhoneMessage(response.data ? "연락처를 저장했습니다." : "연락처를 저장하지 못했습니다.");
      if (response.data) loadAccount();
    } catch (error) {
      console.error(error);
      setPhoneMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setSaving("");
    }
  };

  // 비밀번호 변경 : 현재 비밀번호를 POST /user/login 으로 확인한 뒤 PUT /user 로 새 비밀번호 저장
  const changePassword = async (event) => {
    event.preventDefault();
    if (saving || !account) return;
    if (!password.current || !password.next || !password.confirm) { setPasswordMessage("현재 비밀번호와 새 비밀번호, 비밀번호 확인을 모두 입력해주세요."); return; }
    if (password.next.length < 8) { setPasswordMessage("새 비밀번호는 8자 이상이어야 합니다."); return; }
    if (password.next !== password.confirm) { setPasswordMessage("새 비밀번호 확인이 일치하지 않습니다."); return; }
    setSaving("password");
    setPasswordMessage("");
    try {
      const check = await axios.post("http://localhost:8080/user/login", { userId: account.userId, userPassword: password.current }, { withCredentials: true });
      if (!check.data) { setPasswordMessage("현재 비밀번호가 일치하지 않습니다."); return; }
      const response = await axios.put("http://localhost:8080/user", { userNo: account.userNo, userId: account.userId, email: account.email, phoneNumber: account.phoneNumber, userPassword: password.next }, { withCredentials: true });
      if (response.data) { setPassword({ current: "", next: "", confirm: "" }); setPasswordMessage("비밀번호를 변경했습니다."); }
      else setPasswordMessage("비밀번호를 변경하지 못했습니다.");
    } catch (error) {
      console.error(error);
      setPasswordMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setSaving("");
    }
  };

  const workInfo = [
    ["시급", careworker.hourWage ? `${careworker.hourWage.toLocaleString()}원` : "미등록 (센터에 문의)"],
    ["소속 센터", center?.centerName ?? "-"],
    ["근무 상태", careworker.careworkerState || "-"],
    ["성별", careworker.careworkerGender || "-"],
    ["나이", careworker.careworkerAge ? `${careworker.careworkerAge}세` : "-"],
  ];

  return (
    <div className="space-y-5">
      <CaregiverPageTitle title="내 정보" subtitle="개인 정보와 계정, 근무 정보를 확인하세요." />

      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">개인 정보</h2></div>
        <form onSubmit={saveProfile} className="p-5">
          <fieldset disabled={saving === "profile"} className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">이름<input maxLength={50} value={name} onChange={(event) => { setName(event.target.value); setProfileMessage(""); }} className={field} /></label>
            <label className="text-xs font-semibold text-slate-600">요양보호사 번호<input readOnly value={careworker.careworkerNo} className={`${field} bg-slate-50`} /></label>
            <AddressField key={careworker.careworkerAddress} value={address} onChange={setAddress} className="sm:col-span-2" required />
          </fieldset>
          <p className="mt-4 text-xs leading-5 text-slate-500">주소를 바꾸면 방문 거리 계산에 쓰는 위치도 함께 바뀝니다.</p>
          {profileMessage && <p role="status" className="mt-3 text-sm font-semibold text-teal-700">{profileMessage}</p>}
          <div className="mt-4 flex justify-end"><button type="submit" disabled={saving === "profile"} className={button}>{saving === "profile" ? "저장 중..." : "개인 정보 저장"}</button></div>
        </form>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">연락처</h2></div>
        <form onSubmit={savePhone} noValidate className="p-5">
          <label className="block max-w-md text-xs font-semibold text-slate-600">전화번호<input type="tel" maxLength={20} disabled={!account || saving === "phone"} value={phone} onChange={(event) => { setPhone(event.target.value); setPhoneMessage(""); }} placeholder="010-0000-0000" className={field} /></label>
          {phoneMessage && <p role="status" className="mt-3 text-sm text-slate-700">{phoneMessage}</p>}
          <div className="mt-4 flex justify-end"><button type="submit" disabled={!account || saving === "phone"} className={button}>{saving === "phone" ? "저장 중..." : "연락처 저장"}</button></div>
        </form>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">근무 정보</h2></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {workInfo.map(([label, value]) => <div key={label} className="text-xs font-semibold text-slate-600">{label}<p className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700">{value}</p></div>)}
          <div className="text-xs font-semibold text-slate-600">가입 상태<p className="mt-1.5"><Badge tone={careworker.signState === "승인완료" ? "ok" : "warning"}>{careworker.signState ?? "-"}</Badge></p></div>
          <p className="text-xs leading-5 text-slate-500 sm:col-span-2">근무 정보는 읽기 전용입니다. 시급·소속 센터·근무 상태 변경은 센터 관리자에게 문의해주세요.</p>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">비밀번호 변경</h2></div>
        <form onSubmit={changePassword} noValidate className="p-5">
          <fieldset disabled={!account || saving === "password"} className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">현재 비밀번호<input type="password" autoComplete="current-password" value={password.current} onChange={(event) => { setPassword((p) => ({ ...p, current: event.target.value })); setPasswordMessage(""); }} className={field} /></label>
            <label className="text-xs font-semibold text-slate-600">새 비밀번호<input type="password" autoComplete="new-password" value={password.next} onChange={(event) => { setPassword((p) => ({ ...p, next: event.target.value })); setPasswordMessage(""); }} className={field} placeholder="8자 이상" /></label>
            <label className="text-xs font-semibold text-slate-600">새 비밀번호 확인<input type="password" autoComplete="new-password" value={password.confirm} onChange={(event) => { setPassword((p) => ({ ...p, confirm: event.target.value })); setPasswordMessage(""); }} className={field} placeholder="다시 입력" /></label>
          </fieldset>
          {passwordMessage && <p role="status" className="mt-3 text-sm text-slate-700">{passwordMessage}</p>}
          <div className="mt-4 flex justify-end"><button type="submit" disabled={!account || saving === "password"} className={button}>{saving === "password" ? "변경 중..." : "비밀번호 변경"}</button></div>
        </form>
      </Panel>
    </div>
  );
}
