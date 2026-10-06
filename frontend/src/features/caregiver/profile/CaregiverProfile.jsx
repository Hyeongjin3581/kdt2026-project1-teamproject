import { useEffect, useRef, useState } from "react";
import Panel from "../../../components/common/Panel";
import AddressField from "../../../components/common/AddressField";
import CaregiverPageTitle from "../CaregiverPageTitle";
import caregiverApi from "../caregiverApi";

export default function CaregiverProfile({ careworker, approval, onChanged, onLogout, api = caregiverApi }) {
  const [name, setName] = useState(careworker.careworkerName ?? "");
  const [address, setAddress] = useState(careworker.careworkerAddress ?? "");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [phone, setPhone] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountRetry, setAccountRetry] = useState(0);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const phoneSubmitting = useRef(false);
  const [phoneMessage, setPhoneMessage] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const passwordSubmitting = useRef(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const withdrawSubmitting = useRef(false);
  const withdrawDialog = useRef(null);
  const withdrawTrigger = useRef(null);
  const phoneConnected = typeof api.updatePhone === "function";
  const passwordConnected = typeof api.changePassword === "function";
  const withdrawConnected = typeof api.withdraw === "function";
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const button = "rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400";
  const checkButton = "rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50";

  useEffect(() => {
    setName(careworker.careworkerName ?? "");
    setAddress(careworker.careworkerAddress ?? "");
  }, [careworker]);

  useEffect(() => {
    let active = true;
    setPhone("");
    setPhoneMessage("");
    setPhoneSaved(false);
    setAccountError("");
    if (typeof api.getAccount !== "function") return;
    async function loadAccount() {
      setAccountLoading(true);
      try {
        const response = await api.getAccount(careworker.careworkerNo);
        if (!response.data || typeof response.data !== "object" || Array.isArray(response.data)) throw new Error("회원 정보 형식 오류");
        if (active) setPhone(response.data.phoneNumber ?? "");
      } catch (error) {
        if (active) setAccountError(error.response ? `연락처를 불러오지 못했습니다. (HTTP ${error.response.status})` : "연락처를 불러오지 못했습니다. 다시 시도해주세요.");
      } finally {
        if (active) setAccountLoading(false);
      }
    }
    loadAccount();
    return () => { active = false; };
  }, [careworker.careworkerNo, accountRetry]);

  useEffect(() => {
    if (!withdrawOpen) return;
    const handleKey = (event) => {
      if (event.key === "Escape" && !withdrawSubmitting.current) setWithdrawOpen(false);
      if (event.key !== "Tab") return;
      const controls = withdrawDialog.current?.querySelectorAll("button:not(:disabled), input:not(:disabled)");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => { window.removeEventListener("keydown", handleKey); withdrawTrigger.current?.focus(); };
  }, [withdrawOpen]);

  const save = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    if (api.isDemo) { setMessage("더미 모드에서는 개인 정보를 저장하지 않습니다."); return; }
    setMessage("");
    setSaved(false);
    if (!name.trim() || !address.split(",")[0].trim()) { setMessage("이름과 주소를 입력해주세요."); return; }
    submitting.current = true;
    setSaving(true);
    try {
      // 전체 DTO를 받는 PUT이므로 관리자가 바꿨을 수 있는 근무 정보를 저장 직전에 다시 조회합니다.
      const latest = await api.getProfile(careworker.careworkerNo);
      const current = latest.data;
      if (!current || current.careworkerNo !== careworker.careworkerNo) { setMessage("연결된 요양보호사 정보를 확인할 수 없습니다."); return; }
      const body = {
        careworkerNo: current.careworkerNo,
        careworkerName: name.trim(),
        careworkerAddress: address.trim(),
        careworkerGender: current.careworkerGender,
        careworkerAge: current.careworkerAge,
        hourWage: current.hourWage,
        careworkerState: current.careworkerState,
        centerNo: current.centerNo,
        userNo: current.userNo,
      };
      const response = await api.updateProfile(body);
      if (response.data !== true) { setMessage("개인 정보를 저장하지 못했습니다. 센터와 계정 연결 정보를 확인해주세요."); return; }
      setSaved(true);
      setMessage("개인 정보를 저장했습니다.");
      if (!await onChanged()) setMessage("개인 정보를 저장했지만 최신 정보를 다시 조회하지 못했습니다.");
    } catch (error) {
      setMessage(error.response ? `개인 정보 저장 실패 (HTTP ${error.response.status})` : "백엔드에 연결할 수 없습니다. 서버 실행 상태를 확인해주세요.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const savePhone = async (event) => {
    event.preventDefault();
    if (phoneSubmitting.current) return;
    setPhoneSaved(false);
    if (!/^[0-9+() -]+$/.test(phone.trim()) || !/^\d{9,15}$/.test(phone.replace(/\D/g, ""))) { setPhoneMessage("연락처를 확인해주세요. 숫자 9~15자리를 입력해주세요."); return; }
    if (!phoneConnected) { setPhoneMessage("입력 내용을 확인했습니다. 서버 연결 전이므로 연락처는 저장되지 않았습니다."); return; }
    phoneSubmitting.current = true;
    setPhoneSaving(true);
    setPhoneMessage("");
    try {
      const response = await api.updatePhone({ phoneNumber: phone.trim() });
      if (response.data !== true) { setPhoneMessage("연락처를 저장하지 못했습니다. 입력 내용을 확인해주세요."); return; }
      setPhoneSaved(true);
      setPhoneMessage("연락처를 저장했습니다.");
    } catch (error) {
      setPhoneMessage(error.response ? `연락처 저장 실패 (HTTP ${error.response.status})` : "연락처를 저장하지 못했습니다. 서버 연결 상태를 확인해주세요.");
    } finally {
      phoneSubmitting.current = false;
      setPhoneSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwordSubmitting.current) return;
    setPasswordSaved(false);
    if (!password.current || !password.next || !password.confirm) { setPasswordMessage("현재 비밀번호와 새 비밀번호, 비밀번호 확인을 모두 입력해주세요."); return; }
    if (password.next.length < 8) { setPasswordMessage("새 비밀번호는 8자 이상이어야 합니다."); return; }
    if (password.next !== password.confirm) { setPasswordMessage("새 비밀번호 확인이 일치하지 않습니다."); return; }
    if (password.current === password.next) { setPasswordMessage("현재 비밀번호와 다른 새 비밀번호를 입력해주세요."); return; }
    if (!passwordConnected) { setPasswordMessage("입력 내용을 확인했습니다. 서버 연결 전이므로 비밀번호는 변경되지 않았습니다."); return; }
    passwordSubmitting.current = true;
    setPasswordSaving(true);
    setPasswordMessage("");
    try {
      const response = await api.changePassword({ currentPassword: password.current, newPassword: password.next });
      if (response.data !== true) { setPasswordMessage("비밀번호를 변경하지 못했습니다. 현재 비밀번호를 확인해주세요."); return; }
      setPassword({ current: "", next: "", confirm: "" });
      setPasswordSaved(true);
      setPasswordMessage("비밀번호를 변경했습니다.");
    } catch (error) {
      setPasswordMessage(error.response ? `비밀번호 변경 실패 (HTTP ${error.response.status})` : "비밀번호를 변경하지 못했습니다. 서버 연결 상태를 확인해주세요.");
    } finally {
      passwordSubmitting.current = false;
      setPasswordSaving(false);
    }
  };

  const withdraw = async (event) => {
    event.preventDefault();
    if (withdrawSubmitting.current) return;
    if (!withdrawPassword) { setWithdrawMessage("본인 확인을 위해 현재 비밀번호를 입력해주세요."); return; }
    if (confirmText !== "탈퇴합니다") { setWithdrawMessage('확인 문구 "탈퇴합니다"를 정확히 입력해주세요.'); return; }
    if (!withdrawConnected) { setWithdrawMessage("입력 내용을 확인했습니다. 서버 연결 전이므로 탈퇴 요청은 전송되지 않았습니다."); return; }
    withdrawSubmitting.current = true;
    setWithdrawing(true);
    setWithdrawMessage("");
    try {
      const response = await api.withdraw({ currentPassword: withdrawPassword });
      if (response.data !== true) { setWithdrawMessage("탈퇴를 처리하지 못했습니다. 비밀번호를 확인하거나 센터에 문의해주세요."); return; }
      setWithdrawPassword("");
      setConfirmText("");
      setWithdrawOpen(false);
      if (onLogout) onLogout();
    } catch (error) {
      setWithdrawMessage(error.response ? `회원 탈퇴 실패 (HTTP ${error.response.status})` : "회원 탈퇴를 처리하지 못했습니다. 서버 연결 상태를 확인해주세요.");
    } finally {
      withdrawSubmitting.current = false;
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-5">
      <CaregiverPageTitle title="내 정보" subtitle="개인 정보와 계정, 근무 관련 정보를 한곳에서 확인하세요." />
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">개인 정보</h2></div>
        <form onSubmit={save} className="p-5">
          <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">이름<input required maxLength={50} autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setMessage(""); }} className={field} /></label>
            <label className="text-xs font-semibold text-slate-600">요양보호사 번호<input readOnly value={careworker.careworkerNo} className={`${field} bg-slate-50`} /></label>
            <AddressField key={careworker.careworkerAddress} value={address} onChange={setAddress} className="sm:col-span-2" required />
          </fieldset>
          <p className="mt-4 text-xs leading-5 text-slate-500">이름과 주소를 수정할 수 있습니다. 변경한 내용은 소속 센터의 요양보호사 정보에도 반영됩니다.</p>
          {message && <p role="status" className={`mt-4 text-sm font-semibold ${saved ? "text-teal-700" : "text-rose-600"}`}>{message}</p>}
          <div className="mt-4 flex justify-end"><button type="submit" disabled={saving || api.isDemo} className={button}>{saving ? "저장 중..." : api.isDemo ? "더미 모드 · 저장 안 함" : "개인 정보 저장"}</button></div>
        </form>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">연락처</h2></div>
        <form onSubmit={savePhone} noValidate className="p-5">
          {accountLoading && <p role="status" className="mb-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">연락처를 불러오는 중입니다...</p>}
          {accountError && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-700"><span>{accountError}</span><button type="button" onClick={() => setAccountRetry((current) => current + 1)} className="font-bold underline">다시 불러오기</button></div>}
          <label className="block max-w-md text-xs font-semibold text-slate-600">전화번호<input type="tel" required autoComplete="tel" maxLength={20} disabled={accountLoading || phoneSaving} value={phone} onChange={(event) => { setPhone(event.target.value); setPhoneMessage(""); setPhoneSaved(false); }} placeholder="010-0000-0000" className={field} /></label>
          {!phoneConnected && <p className="mt-3 text-xs leading-5 text-slate-500">연락처 조회·변경은 서버 API 연결을 기다리고 있습니다. 입력 확인은 가능하며 저장 요청은 전송되지 않습니다.</p>}
          {phoneMessage && <p role="status" className={`mt-3 text-sm ${phoneSaved ? "text-teal-700" : "text-slate-700"}`}>{phoneMessage}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {!phoneConnected && <button type="submit" disabled={accountLoading || phoneSaving} className={checkButton}>입력 확인</button>}
            <button type={phoneConnected ? "submit" : "button"} disabled={!phoneConnected || accountLoading || phoneSaving} className={button}>{phoneSaving ? "저장 중..." : phoneConnected ? "연락처 저장" : "연락처 저장 (연결 대기)"}</button>
          </div>
        </form>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">근무 정보</h2></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {[["시급", careworker.hourWage == null ? "미등록" : `${careworker.hourWage.toLocaleString()}원`], ["소속 센터 번호", careworker.centerNo ?? "미등록"], ["근무 상태", careworker.careworkerState || "미등록"], ["성별", careworker.careworkerGender || "미등록"], ["나이", careworker.careworkerAge == null ? "미등록" : `${careworker.careworkerAge}세`]].map(([label, value]) => <label key={label} className="text-xs font-semibold text-slate-600">{label}<input readOnly value={value} className={`${field} bg-slate-50`} /></label>)}
          <div className="text-xs font-semibold text-slate-600">승인 정보<p className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700">{approval?.approved === true ? "승인 완료" : approval?.approved === false ? "승인 대기" : "전달된 승인 정보가 없습니다."}</p></div>
          <p className="text-xs leading-5 text-slate-500 sm:col-span-2">근무 정보는 읽기 전용입니다. 시급·소속 센터·근무 상태 변경은 관리자에게 문의해주세요.</p>
        </div>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">비밀번호 변경</h2></div>
        <form onSubmit={changePassword} noValidate className="p-5">
          <fieldset disabled={passwordSaving} className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">현재 비밀번호<input required type="password" autoComplete="current-password" value={password.current} onChange={(event) => { setPassword((current) => ({ ...current, current: event.target.value })); setPasswordMessage(""); }} className={field} /></label>
            <label className="text-xs font-semibold text-slate-600">새 비밀번호<input required type="password" autoComplete="new-password" minLength={8} value={password.next} onChange={(event) => { setPassword((current) => ({ ...current, next: event.target.value })); setPasswordMessage(""); }} className={field} placeholder="8자 이상" /></label>
            <label className="text-xs font-semibold text-slate-600">새 비밀번호 확인<input required type="password" autoComplete="new-password" value={password.confirm} onChange={(event) => { setPassword((current) => ({ ...current, confirm: event.target.value })); setPasswordMessage(""); }} className={field} placeholder="새 비밀번호를 다시 입력" /></label>
          </fieldset>
          <p className="mt-3 text-xs leading-5 text-slate-500">현재 비밀번호와 다른 8자 이상의 비밀번호를 입력해주세요.{!passwordConnected && " 비밀번호 변경은 서버 API 연결 후 사용할 수 있습니다."}</p>
          {passwordMessage && <p role="status" className={`mt-3 text-sm ${passwordSaved ? "text-teal-700" : "text-slate-700"}`}>{passwordMessage}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {!passwordConnected && <button type="submit" className={checkButton}>입력 확인</button>}
            <button type={passwordConnected ? "submit" : "button"} disabled={!passwordConnected || passwordSaving} className={button}>{passwordSaving ? "변경 중..." : passwordConnected ? "비밀번호 변경" : "비밀번호 변경 (연결 대기)"}</button>
          </div>
        </form>
      </Panel>
      <Panel className="border-red-200 p-5">
        <h2 className="font-display font-bold text-red-700">회원 탈퇴</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">탈퇴하면 계정 이용이 종료됩니다. 진행 중인 근무나 방문 일정이 있다면 소속 센터에 먼저 문의해주세요.</p>
        <button ref={withdrawTrigger} type="button" onClick={() => { setWithdrawPassword(""); setConfirmText(""); setWithdrawMessage(""); setWithdrawOpen(true); }} className="mt-4 rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100">회원 탈퇴</button>
        {!withdrawConnected && <p className="mt-3 text-xs text-slate-500">탈퇴 전 확인 화면을 볼 수 있습니다. 실제 탈퇴는 서버 API 연결 후 가능합니다.</p>}
      </Panel>
      {withdrawOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => { if (!withdrawSubmitting.current) setWithdrawOpen(false); }}>
        <div ref={withdrawDialog} role="dialog" aria-modal="true" aria-labelledby="withdraw-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white text-slate-700 shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h2 id="withdraw-title" className="font-display text-lg font-bold text-red-700">회원 탈퇴 확인</h2><button type="button" autoFocus aria-label="닫기" onClick={() => setWithdrawOpen(false)} disabled={withdrawing} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100 disabled:opacity-50">×</button></div>
          <form onSubmit={withdraw} noValidate>
            <fieldset disabled={withdrawing} className="space-y-4 px-6 py-5">
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">탈퇴 후에는 해당 계정으로 서비스를 이용할 수 없습니다. 본인 확인과 탈퇴 의사 확인을 위해 아래 내용을 입력해주세요.</p>
              <label className="block text-xs font-semibold text-slate-600">현재 비밀번호<input required type="password" autoComplete="current-password" value={withdrawPassword} onChange={(event) => { setWithdrawPassword(event.target.value); setWithdrawMessage(""); }} className={field} /></label>
              <label className="block text-xs font-semibold text-slate-600">확인 문구 입력<span className="ml-1 font-normal text-slate-500">("탈퇴합니다"라고 입력)</span><input required value={confirmText} onChange={(event) => { setConfirmText(event.target.value); setWithdrawMessage(""); }} placeholder="탈퇴합니다" autoComplete="off" className={field} /></label>
              {!withdrawConnected && <p className="text-xs leading-5 text-slate-500">회원 탈퇴 API 연결 대기 상태입니다. 입력 확인을 해도 계정은 삭제되지 않습니다.</p>}
              {withdrawMessage && <p role="status" className="text-sm text-rose-700">{withdrawMessage}</p>}
            </fieldset>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setWithdrawOpen(false)} disabled={withdrawing} className={checkButton}>취소</button>
              {!withdrawConnected && <button type="submit" className={checkButton}>입력 확인</button>}
              <button type={withdrawConnected ? "submit" : "button"} disabled={!withdrawConnected || withdrawing} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{withdrawing ? "탈퇴 처리 중..." : withdrawConnected ? "탈퇴하기" : "탈퇴하기 (연결 대기)"}</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}
