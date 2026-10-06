import { useEffect, useRef, useState } from "react";
import AddressField from "../../components/common/AddressField";
import caregiverApi from "../caregiver/caregiverApi";
import CaregiverCenterSelect from "./CaregiverCenterSelect";
import CaregiverApprovalModal from "./CaregiverApprovalModal";

export default function CaregiverSignupForm({ onLogin }) {
  const [form, setForm] = useState({ userId: "", userPassword: "", passwordConfirm: "", careworkerName: "", phoneNumber: "", careworkerAddress: "", centerNo: "", agreed: false });
  const [centers, setCenters] = useState([]);
  const [centersLoading, setCentersLoading] = useState(false);
  const [centersError, setCentersError] = useState("");
  const [reload, setReload] = useState(0);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const sending = useRef(false);
  const connected = typeof caregiverApi.signup === "function";
  const centersConnected = typeof caregiverApi.getCenters === "function";
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })); setMessage(""); };

  useEffect(() => {
    if (!centersConnected) return;
    let active = true;
    setCentersLoading(true);
    setCentersError("");
    caregiverApi.getCenters().then((response) => {
      if (!active) return;
      if (!Array.isArray(response.data)) { setCentersError("센터 목록을 확인할 수 없습니다. 다시 불러와주세요."); return; }
      setCenters(response.data);
    }).catch(() => { if (active) setCentersError("센터 목록을 불러오지 못했습니다. 다시 시도해주세요."); }).finally(() => { if (active) setCentersLoading(false); });
    return () => { active = false; };
  }, [centersConnected, reload]);

  const validate = () => {
    const next = {};
    if (!form.userId.trim()) next.userId = "아이디를 입력해주세요.";
    else if (/\s/.test(form.userId.trim())) next.userId = "아이디에는 공백을 사용할 수 없습니다.";
    if (form.userPassword.length < 8) next.userPassword = "비밀번호는 8자 이상 입력해주세요.";
    if (!form.passwordConfirm || form.passwordConfirm !== form.userPassword) next.passwordConfirm = "비밀번호 확인이 일치하지 않습니다.";
    if (!form.careworkerName.trim()) next.careworkerName = "이름을 입력해주세요.";
    if (!/^[0-9+() -]+$/.test(form.phoneNumber.trim()) || !/^\d{9,15}$/.test(form.phoneNumber.replace(/\D/g, ""))) next.phoneNumber = "연락처를 확인해주세요. 숫자 9~15자리를 입력해주세요.";
    if (!form.careworkerAddress.split(",")[0].trim()) next.careworkerAddress = "주소를 검색하여 선택해주세요.";
    if (!form.centerNo || !centers.some((center) => center.centerNo === Number(form.centerNo))) next.centerNo = "소속 센터를 선택해주세요.";
    if (!form.agreed) next.agreed = "필수 동의 항목을 확인해주세요.";
    setErrors(next);
    setMessage(Object.keys(next).length ? "입력 항목을 확인해주세요. 가입 신청은 아직 제출되지 않았습니다." : "입력 항목을 확인했습니다. 가입 신청은 아직 제출되지 않았습니다.");
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (sending.current || !validate()) return;
    if (!connected) { setMessage("회원가입 서버 연결 후 신청할 수 있습니다. 입력 정보는 전송되지 않았습니다."); return; }
    sending.current = true;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await caregiverApi.signup({ userId: form.userId.trim(), userPassword: form.userPassword, careworkerName: form.careworkerName.trim(), phoneNumber: form.phoneNumber.trim(), careworkerAddress: form.careworkerAddress.trim(), centerNo: Number(form.centerNo) });
      if (response.data === true) setDone(true);
      else setMessage("가입 신청이 접수되지 않았습니다. 입력 정보를 확인해주세요.");
    } catch (error) {
      setMessage(error.response?.status === 409 ? "이미 사용 중인 가입 정보가 있습니다. 아이디와 연락처를 확인해주세요." : "가입 신청을 전송하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  // 실제 가입 API의 성공 응답에서만 done이 true가 됩니다.
  if (done) return <CaregiverApprovalModal onLogin={onLogin} />;

  return (
    <form onSubmit={submit} noValidate className="mt-5 text-slate-700">
      <fieldset disabled={submitting} className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">아이디 <span className="text-teal-600">*</span><input required autoComplete="username" value={form.userId} onChange={(event) => update("userId", event.target.value)} className={field} placeholder="로그인에 사용할 아이디" />{errors.userId && <span className="mt-1 block text-rose-600">{errors.userId}</span>}</label>
        <label className="text-xs font-semibold text-slate-600">비밀번호 <span className="text-teal-600">*</span><input required type="password" autoComplete="new-password" value={form.userPassword} onChange={(event) => update("userPassword", event.target.value)} className={field} placeholder="8자 이상" />{errors.userPassword && <span className="mt-1 block text-rose-600">{errors.userPassword}</span>}</label>
        <label className="text-xs font-semibold text-slate-600">비밀번호 확인 <span className="text-teal-600">*</span><input required type="password" autoComplete="new-password" value={form.passwordConfirm} onChange={(event) => update("passwordConfirm", event.target.value)} className={field} placeholder="비밀번호 다시 입력" />{errors.passwordConfirm && <span className="mt-1 block text-rose-600">{errors.passwordConfirm}</span>}</label>
        <label className="text-xs font-semibold text-slate-600">이름 <span className="text-teal-600">*</span><input required autoComplete="name" value={form.careworkerName} onChange={(event) => update("careworkerName", event.target.value)} className={field} placeholder="이름" />{errors.careworkerName && <span className="mt-1 block text-rose-600">{errors.careworkerName}</span>}</label>
        <label className="text-xs font-semibold text-slate-600">연락처 <span className="text-teal-600">*</span><input required type="tel" autoComplete="tel" value={form.phoneNumber} onChange={(event) => update("phoneNumber", event.target.value)} className={field} placeholder="010-0000-0000" />{errors.phoneNumber && <span className="mt-1 block text-rose-600">{errors.phoneNumber}</span>}</label>
        <div className="sm:col-span-2"><AddressField required value={form.careworkerAddress} onChange={(value) => update("careworkerAddress", value)} />{errors.careworkerAddress && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.careworkerAddress}</p>}</div>
        <div className="sm:col-span-2"><CaregiverCenterSelect centers={centers} value={form.centerNo} onChange={(value) => update("centerNo", value)} loading={centersLoading} error={centersError} connected={centersConnected} onRetry={() => setReload((current) => current + 1)} />{errors.centerNo && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.centerNo}</p>}</div>
        <label className="flex items-start gap-2 text-xs leading-5 text-slate-500 sm:col-span-2"><input type="checkbox" checked={form.agreed} onChange={(event) => update("agreed", event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-teal-600" /><span>서비스 이용약관 및 개인정보 처리방침에 동의합니다. (필수){errors.agreed && <span className="mt-1 block font-semibold text-rose-600">{errors.agreed}</span>}</span></label>
      </fieldset>
      <div className="mt-5 rounded-xl bg-teal-50 p-4 text-xs leading-5 text-teal-800"><p className="font-bold">가입 후 이용 절차</p><ol className="mt-2 list-inside list-decimal space-y-1"><li>가입 정보를 입력하고 소속 센터 선택</li><li>가입 신청 후 센터 관리자 승인 대기</li><li>승인 후 로그인하여 일정과 가용시간 관리</li></ol></div>
      {message && <p role="status" className={`mt-4 text-xs leading-5 ${Object.values(errors).some(Boolean) ? "text-rose-600" : "text-slate-600"}`}>{message}</p>}
      {!connected && <p id="caregiver-signup-connection" className="mt-4 text-xs leading-5 text-slate-500">회원가입 서버 연결 대기 중입니다. 정보를 입력하고 확인할 수 있으며 가입 신청은 연결 후 가능합니다.</p>}
      <div className="mt-5 grid gap-2 sm:grid-cols-[auto_1fr]"><button type="button" disabled={submitting} onClick={validate} className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">입력 내용 확인</button><button type="submit" disabled={!connected || submitting || centersLoading || Boolean(centersError) || !centers.length} aria-describedby={!connected ? "caregiver-signup-connection" : undefined} className="rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? "가입 신청 중..." : "가입 신청"}</button></div>
    </form>
  );
}
