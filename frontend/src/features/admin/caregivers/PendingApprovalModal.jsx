import { useEffect, useState } from "react";
import axios from "axios";
import Badge from "../../../components/common/Badge";

// 요양보호사 가입 승인 창 : 가입 상태가 '승인대기'인 신청을 확인하고 승인한다.
// 목록 조회·승인 API 는 시스템 관리자(카테고리 4)만 쓸 수 있고, 다른 계정은 403 을 받는다.
export default function PendingApprovalModal({ centers, onClose, onApproved }) {
  const [pending, setPending] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | forbidden | error
  const [busyNo, setBusyNo] = useState(null);
  const [message, setMessage] = useState("");

  // 가입 승인 대기 목록 : axios.get("통신할주소", { 옵션 }) → GET /api/careworkers/pending
  async function loadPending() {
    try {
      const response = await axios.get("http://localhost:8080/api/careworkers/pending", { withCredentials: true });
      setPending(response.data);
      setStatus("ok");
    } catch (error) {
      // 401 : 로그인 만료, 403 : 시스템 관리자가 아님
      if (error.response?.status === 401 || error.response?.status === 403) setStatus("forbidden");
      else { console.error("가입 승인 목록 조회 실패:", error); setStatus("error"); }
    }
  }
  useEffect(() => { loadPending(); }, []);

  // 승인 : POST /api/careworkers/approve?careworkerNo=번호 → 가입 상태 '승인완료' (이후 로그인 가능)
  const approve = async (cw) => {
    if (busyNo) return;
    if (!window.confirm(`${cw.careworkerName} 요양보호사의 가입을 승인할까요?`)) return;
    setBusyNo(cw.careworkerNo);
    setMessage("");
    try {
      const response = await axios.post("http://localhost:8080/api/careworkers/approve", null, { params: { careworkerNo: cw.careworkerNo }, withCredentials: true });
      if (response.data) {
        setMessage(`${cw.careworkerName} 요양보호사의 가입을 승인했습니다. 이제 로그인할 수 있습니다.`);
        await loadPending();
        onApproved(); // 요양보호사 목록과 승인 대기 건수를 다시 불러온다
      } else {
        alert("승인하지 못했습니다. 이미 승인된 신청이거나 시스템 관리자 권한이 필요합니다.");
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setBusyNo(null);
    }
  };

  const centerName = (no) => centers.find((c) => c.id === no)?.name ?? "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white text-slate-700 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div><h2 className="font-display text-lg font-bold text-slate-900">요양보호사 가입 승인</h2><p className="mt-0.5 text-xs text-slate-500">승인한 요양보호사만 로그인할 수 있습니다.</p></div>
          <button type="button" aria-label="닫기" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100">×</button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto">
          {message && <p role="status" className="m-5 rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p>}
          {status === "loading" && <p className="px-6 py-14 text-center text-sm text-slate-500">가입 신청을 불러오는 중입니다...</p>}
          {status === "error" && <div className="px-6 py-14 text-center"><p className="text-sm font-semibold text-rose-600">가입 신청을 불러오지 못했습니다.</p><button type="button" onClick={loadPending} className="mt-3 text-sm font-bold text-teal-700 underline">다시 불러오기</button></div>}
          {status === "forbidden" && <div className="px-6 py-14 text-center"><p className="text-sm font-bold text-slate-700">시스템 관리자만 가입 신청을 확인하고 승인할 수 있습니다.</p><p className="mt-2 text-xs text-slate-500">시스템 관리자 계정으로 로그인했는지 확인해주세요. 로그인이 만료된 경우 다시 로그인해주세요.</p></div>}
          {status === "ok" && (pending.length === 0 ? <p className="px-6 py-14 text-center text-sm text-slate-400">승인을 기다리는 가입 신청이 없습니다.</p> : (
            <div className="divide-y divide-slate-100">
              {pending.map((cw) => (
                <article key={cw.careworkerNo} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2"><b className="text-sm text-slate-900">{cw.careworkerName}</b><span className="text-xs text-slate-500">{cw.careworkerGender} · {cw.careworkerAge}세</span><Badge tone="warning">{cw.signState}</Badge></div>
                    <p className="mt-1 text-xs text-slate-500">{centerName(cw.centerNo)} · {cw.careworkerAddress}</p>
                  </div>
                  <button type="button" onClick={() => approve(cw)} disabled={busyNo !== null} className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50">{busyNo === cw.careworkerNo ? "승인 중..." : "승인"}</button>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
