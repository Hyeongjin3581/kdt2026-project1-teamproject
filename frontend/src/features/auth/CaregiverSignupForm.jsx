import { useEffect, useState } from "react";
import axios from "axios";
import AddressField from "../../components/common/AddressField";
import CaregiverCenterSelect from "./CaregiverCenterSelect";
import CaregiverApprovalModal from "./CaregiverApprovalModal";

// 요양보호사 가입 신청 : POST /user/careworker 한 번으로 사용자 계정과 요양보호사 정보를 함께 만든다.
// 서버가 가입 상태(sign_state)를 '승인대기'로 저장하므로, 시스템 관리자가 승인해야 로그인할 수 있다.
export default function CaregiverSignupForm({ onLogin }) {
  const [form, setForm] = useState({ userId: "", userPassword: "", passwordConfirm: "", careworkerName: "", phoneNumber: "", email: "", careworkerGender: "여자", careworkerAge: "", careworkerAddress: "", centerNo: "", agreed: false });
  const [centers, setCenters] = useState([]);
  const [centersStatus, setCentersStatus] = useState("loading");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })); setMessage(""); };

  // 소속 센터 목록 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadCenters() {
    setCentersStatus("loading");
    try {
      const response = await axios.get("http://localhost:8080/center", { withCredentials: true });
      setCenters(response.data);
      setCentersStatus("ok");
    } catch (error) {
      console.error("센터 목록 조회 실패:", error);
      setCentersStatus("error");
    }
  }
  useEffect(() => { loadCenters(); }, []);

  const validate = () => {
    const next = {};
    if (!form.userId.trim()) next.userId = "아이디를 입력해주세요.";
    else if (/\s/.test(form.userId.trim())) next.userId = "아이디에는 공백을 사용할 수 없습니다.";
    if (form.userPassword.length < 8) next.userPassword = "비밀번호는 8자 이상 입력해주세요.";
    if (!form.passwordConfirm || form.passwordConfirm !== form.userPassword) next.passwordConfirm = "비밀번호 확인이 일치하지 않습니다.";
    if (!form.careworkerName.trim()) next.careworkerName = "이름을 입력해주세요.";
    if (!/^\d{9,15}$/.test(form.phoneNumber.replace(/\D/g, ""))) next.phoneNumber = "연락처를 확인해주세요. 숫자 9~15자리를 입력해주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "이메일 형식을 확인해주세요.";
    if (!Number.isInteger(Number(form.careworkerAge)) || Number(form.careworkerAge) < 18 || Number(form.careworkerAge) > 100) next.careworkerAge = "나이를 18~100 사이 숫자로 입력해주세요.";
    if (!form.careworkerAddress.split(",")[0].trim()) next.careworkerAddress = "주소를 검색하여 선택해주세요.";
    if (!form.centerNo) next.centerNo = "소속 센터를 선택해주세요.";
    if (!form.agreed) next.agreed = "필수 동의 항목을 확인해주세요.";
    setErrors(next);
    setMessage(Object.keys(next).length ? "입력 항목을 확인해주세요." : "");
    return Object.keys(next).length === 0;
  };

  // 가입 신청 : axios.post("통신할주소", { body }, { 옵션 }) → 컨트롤러가 boolean 을 반환
  const submit = async (event) => {
    event.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      // 같은 아이디가 이미 있으면 서버에 보내지 않는다 (서버에 아이디 중복 검사가 없음)
      const users = await axios.get("http://localhost:8080/user", { withCredentials: true });
      if (users.data.some((u) => u.userId === form.userId.trim())) {
        setErrors((current) => ({ ...current, userId: "이미 사용 중인 아이디입니다." }));
        setMessage("입력 항목을 확인해주세요.");
        return;
      }
      const response = await axios.post("http://localhost:8080/user/careworker", {
        userId: form.userId.trim(),
        userPassword: form.userPassword,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        careworkerName: form.careworkerName.trim(),
        careworkerAddress: form.careworkerAddress.trim(),
        careworkerGender: form.careworkerGender,
        careworkerAge: Number(form.careworkerAge),
        hourWage: 0,                // 시급은 승인 후 관리자가 요양보호사 관리에서 입력
        careworkerState: "근무중",
        centerNo: Number(form.centerNo),
      }, { withCredentials: true });
      if (response.data) setDone(true);
      else setMessage("가입 신청이 접수되지 않았습니다. 입력 정보를 확인해주세요.");
    } catch (error) {
      console.error(error);
      setMessage("서버 통신 오류가 발생했습니다. 백엔드(localhost:8080) 실행 상태를 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  // 가입 신청이 접수되면 승인 대기 안내 창을 띄운다
  if (done) return <CaregiverApprovalModal onLogin={onLogin} />;

  // 보호자·관리자 회원가입(Signup.jsx)과 같은 입력 순서·글꼴로 맞춘다 : 이름·연락처 → 아이디 → 이메일 → 비밀번호 → (요양보호사 정보) → 동의
  const errorText = (key) => errors[key] && <span className="mt-1 block text-[11px] font-semibold text-rose-600">{errors[key]}</span>;
  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={submitting} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">이름<input autoComplete="name" value={form.careworkerName} onChange={(event) => update("careworkerName", event.target.value)} maxLength={50} className={field} placeholder="홍길동" />{errorText("careworkerName")}</label>
        <label className="text-xs font-semibold text-slate-600">연락처<input type="tel" autoComplete="tel" value={form.phoneNumber} onChange={(event) => update("phoneNumber", event.target.value)} className={field} placeholder="010-0000-0000" />{errorText("phoneNumber")}</label>
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">아이디<input autoComplete="username" value={form.userId} onChange={(event) => update("userId", event.target.value)} className={field} placeholder="로그인에 사용할 아이디" />{errorText("userId")}</label>
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">이메일<input type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} className={field} placeholder="you@gmail.com" />{errorText("email")}</label>
        <label className="text-xs font-semibold text-slate-600">비밀번호<input type="password" autoComplete="new-password" value={form.userPassword} onChange={(event) => update("userPassword", event.target.value)} className={field} placeholder="8자 이상" />{errorText("userPassword")}</label>
        <label className="text-xs font-semibold text-slate-600">비밀번호 확인<input type="password" autoComplete="new-password" value={form.passwordConfirm} onChange={(event) => update("passwordConfirm", event.target.value)} className={field} placeholder="다시 입력" />{errorText("passwordConfirm")}</label>
        <label className="text-xs font-semibold text-slate-600">성별<select value={form.careworkerGender} onChange={(event) => update("careworkerGender", event.target.value)} className={field}><option>여자</option><option>남자</option></select></label>
        <label className="text-xs font-semibold text-slate-600">나이<input type="number" min="18" max="100" value={form.careworkerAge} onChange={(event) => update("careworkerAge", event.target.value)} className={field} placeholder="만 나이" />{errorText("careworkerAge")}</label>
        <div className="sm:col-span-2"><AddressField value={form.careworkerAddress} onChange={(value) => update("careworkerAddress", value)} />{errors.careworkerAddress && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.careworkerAddress}</p>}</div>
        <div className="sm:col-span-2"><CaregiverCenterSelect centers={centers} value={form.centerNo} onChange={(value) => update("centerNo", value)} loading={centersStatus === "loading"} error={centersStatus === "error" ? "센터 목록을 불러오지 못했습니다." : centersStatus === "ok" && centers.length === 0 ? "등록된 센터가 없습니다. 서버를 확인한 뒤 다시 불러와주세요." : ""} connected onRetry={loadCenters} />{errors.centerNo && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.centerNo}</p>}</div>
      </fieldset>
      <label className="mt-5 flex items-start gap-2 text-xs text-slate-500"><input type="checkbox" checked={form.agreed} onChange={(event) => update("agreed", event.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-600" /><span>서비스 이용약관 및 개인정보 처리방침에 동의합니다. (필수){errors.agreed && <span className="mt-1 block font-semibold text-rose-600">{errors.agreed}</span>}</span></label>
      {message && <p className="mt-4 text-xs font-semibold text-rose-600">{message}</p>}
      <button type="submit" disabled={submitting || centersStatus !== "ok"} className="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? "가입 중..." : "가입하기"}</button>
    </form>
  );
}
