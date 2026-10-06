import { useEffect, useState } from "react";

// 취소 요청 API 계약이 없는 동안 입력 UI만 제공합니다. 확정 일정은 변경하지 않습니다.
export default function ScheduleCancelRequestModal({ item, onClose }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const close = () => { if (reason.trim()) setConfirmClose(true); else onClose(); };
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") { if (reason.trim()) setConfirmClose(true); else onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reason, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="schedule-cancel-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-slate-700 shadow-2xl">
        <h2 id="schedule-cancel-title" className="font-display text-lg font-bold text-slate-900">근무 취소 요청</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">요청 → 센터 관리자 확인 → 일정 확정 순서로 진행됩니다. 요청만으로 근무가 취소되거나 시간이 변경되지 않습니다.</p>
        <dl className="mt-4 grid grid-cols-[70px_1fr] gap-2 rounded-lg bg-slate-50 p-4 text-sm"><dt>방문일</dt><dd>{item.visitDate || "미정"}</dd><dt>시간</dt><dd>{item.startTime || "미정"} ~ {item.endTime || "미정"}</dd><dt>수급자</dt><dd>{item.recipientName || "정보 없음"}</dd></dl>
        <form noValidate onSubmit={(event) => { event.preventDefault(); setMessage(reason.trim() ? "입력 내용을 확인했습니다. 서버 미연결로 요청은 전송되지 않았습니다." : "취소 요청 사유를 입력해주세요."); }}>
          <label className="mt-4 block text-sm font-semibold">취소 요청 사유<textarea autoFocus required maxLength={1000} rows={4} value={reason} onChange={(event) => { setReason(event.target.value); setMessage(""); setConfirmClose(false); }} className="mt-2 w-full resize-y rounded-lg border border-slate-200 p-3 text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" placeholder="센터에서 확인할 수 있도록 사유를 입력해주세요." /></label>
          {message && <p role="status" className="mt-2 text-xs text-teal-800">{message}</p>}
          <p id="cancel-request-pending" className="mt-3 text-xs leading-5 text-slate-500">취소 요청 API 연결 대기 중입니다. 현재 입력 내용은 저장·전송되지 않습니다.</p>
          <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={close} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold">닫기</button><button type="submit" className="rounded-lg border border-teal-200 px-4 py-2.5 text-sm font-bold text-teal-700">입력 내용 확인</button><button type="button" disabled aria-describedby="cancel-request-pending" className="cursor-not-allowed rounded-lg bg-slate-300 px-4 py-2.5 text-sm font-bold text-white">요청 전송 · 연결 대기</button></div>
        </form>
        {confirmClose && <div role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><p>입력한 사유를 버리고 닫으시겠습니까?</p><div className="mt-2 flex gap-3"><button type="button" onClick={() => setConfirmClose(false)} className="font-bold text-slate-600">계속 작성</button><button type="button" onClick={onClose} className="font-bold text-rose-600">버리고 닫기</button></div></div>}
      </div>
    </div>
  );
}
