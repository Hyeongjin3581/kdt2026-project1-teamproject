export default function CaregiverApprovalModal({ onLogin }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="caregiver-approval-title" className="w-full max-w-md rounded-2xl bg-white p-6 text-center text-slate-700 shadow-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-100 text-2xl text-teal-700">✓</div>
        <h2 id="caregiver-approval-title" className="mt-5 font-display text-xl font-bold text-slate-900">가입 신청이 완료되었습니다.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">소속 센터 관리자의 승인 후 로그인할 수 있습니다.</p>
        <p className="mt-2 text-xs text-slate-400">승인 상태는 소속 센터에 문의해주세요.</p>
        <button autoFocus type="button" onClick={onLogin} className="mt-6 rounded-lg bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700">확인 · 로그인 화면으로</button>
      </div>
    </div>
  );
}
