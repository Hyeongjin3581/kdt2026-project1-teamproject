import { useEffect, useRef, useState } from "react";
import caregiverApi from "../caregiver/caregiverApi";

export default function CaregiverLoginForm({ login }) {
  const [userId, setUserId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [message, setMessage] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sending = useRef(false);
  const active = useRef(true);
  const connected = typeof caregiverApi.login === "function";
  const demoSelected = import.meta.env.DEV && userId.trim() === "caregiver_demo";
  const field = "mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  const validate = () => {
    const error = !userId.trim() ? "아이디를 입력해주세요." : !userPassword ? "비밀번호를 입력해주세요." : "";
    setMessage(error);
    return !error;
  };

  const enterDemo = async (id, password) => {
    if (!import.meta.env.DEV || sending.current) return;
    sending.current = true;
    setSubmitting(true);
    setMessage("");
    setApprovalMessage("");
    try {
      // 운영 빌드에는 더미 계정 모듈을 포함하지 않습니다.
      const { createCaregiverDemo } = await import("../caregiver/caregiverDemo");
      const demo = createCaregiverDemo(id, password);
      if (active.current) login("caregiver", demo.careworkerNo, { approved: true, canUse: true, demo: true }, demo.api);
    } catch (error) {
      if (active.current) setMessage(error.message || "더미 화면을 열지 못했습니다.");
    } finally {
      sending.current = false;
      if (active.current) setSubmitting(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (sending.current || !validate()) return;
    setApprovalMessage("");
    if (demoSelected) { await enterDemo(userId.trim(), userPassword); return; }
    if (!connected) {
      setMessage("로그인 서버 연결 후 이용할 수 있습니다. 입력 정보는 전송되지 않았습니다.");
      return;
    }
    sending.current = true;
    setSubmitting(true);
    try {
      const response = await caregiverApi.login({ userId: userId.trim(), userPassword });
      if (!active.current) return;
      const account = response.data;
      if (account?.role !== "caregiver" || !Number.isInteger(account?.careworkerNo) || account.careworkerNo < 1) {
        setMessage("요양보호사 계정 정보를 확인할 수 없습니다. 소속 센터에 문의해주세요.");
        return;
      }
      if (account.canUse === false) {
        setApprovalMessage("현재 이용이 제한된 계정입니다. 소속 센터에 이용 상태를 확인해주세요.");
        return;
      }
      if (account.approved !== true) {
        setApprovalMessage(account.approved === false ? "센터 승인 대기 중인 계정입니다. 소속 센터에서 승인한 후 로그인할 수 있습니다." : "승인 상태를 확인할 수 없습니다. 소속 센터에 문의해주세요.");
        return;
      }
      if (!login("caregiver", account.careworkerNo, { approved: account.approved, canUse: account.canUse })) {
        setMessage("로그인 정보를 확인하지 못했습니다. 다시 로그인해주세요.");
      }
    } catch (error) {
      if (!active.current) return;
      if (error.response?.status === 403) setApprovalMessage("계정 승인 또는 이용 상태를 확인해주세요. 소속 센터에 문의할 수 있습니다.");
      else setMessage(error.response?.status === 401 ? "아이디 또는 비밀번호를 확인해주세요." : "로그인하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="mt-6 text-slate-700">
      <fieldset disabled={submitting}>
        <label className="block text-xs font-semibold text-slate-600">아이디<input required autoComplete="username" value={userId} onChange={(event) => { setUserId(event.target.value); setMessage(""); }} onBlur={() => { if (!userId.trim()) setMessage("아이디를 입력해주세요."); }} className={field} placeholder="가입한 아이디" /></label>
        <label className="mt-5 block text-xs font-semibold text-slate-600">비밀번호<input required type="password" autoComplete="current-password" value={userPassword} onChange={(event) => { setUserPassword(event.target.value); setMessage(""); }} onBlur={() => { if (!userPassword) setMessage("비밀번호를 입력해주세요."); }} className={field} placeholder="비밀번호" /></label>
      </fieldset>
      <div className="mt-4 rounded-lg bg-teal-50 px-4 py-3 text-xs leading-5 text-teal-800">가입한 소속 센터의 관리자 승인 후 이용할 수 있습니다. 승인 여부는 로그인 시 확인합니다.</div>
      {approvalMessage && <p role="status" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">{approvalMessage}</p>}
      {message && <p role="alert" className="mt-4 text-xs font-semibold text-rose-600">{message}</p>}
      {!connected && <p id="caregiver-login-connection" className="mt-4 text-xs leading-5 text-slate-500">일반 계정 로그인은 서버 연결 후 승인된 계정으로 이용할 수 있습니다.</p>}
      <button type="submit" disabled={(!connected && !demoSelected) || submitting} aria-describedby={!connected ? "caregiver-login-connection" : undefined} className="mt-5 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? "로그인 확인 중..." : demoSelected ? "더미 계정 로그인" : "요양보호사 로그인"}</button>
      {import.meta.env.DEV && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
        <p className="font-bold">개발용 요양보호사 더미 계정</p>
        <p>아이디: <b className="font-mono">caregiver_demo</b><br />비밀번호: <b className="font-mono">oncare1234</b></p>
        <p className="mt-1">예시 데이터로 화면과 입력 폼을 확인합니다. 실제 저장·삭제는 하지 않습니다.</p>
        <button type="button" disabled={submitting} onClick={() => { setUserId("caregiver_demo"); setUserPassword("oncare1234"); enterDemo("caregiver_demo", "oncare1234"); }} className="mt-3 w-full rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50">더미 계정으로 둘러보기</button>
      </div>}
    </form>
  );
}
