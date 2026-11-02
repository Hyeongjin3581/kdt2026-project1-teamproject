// 요양보호사 가입 신청 직후 안내 : 서버가 '승인대기'로 저장했으므로 관리자 승인 후 로그인할 수 있다.
export default function CaregiverApprovalModal({ onLogin }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="caregiver-approval-title" className="w-full max-w-md rounded-2xl bg-white p-6 text-center text-slate-700 shadow-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-2xl text-amber-600">⏳</div>
        <span className="mt-4 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">가입 승인 대기</span>
        <h2 id="caregiver-approval-title" className="mt-3 font-display text-xl font-bold text-slate-900">가입 신청이 접수되었습니다</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">관리자가 가입을 승인하면 로그인할 수 있습니다.<br />승인 전에는 로그인이 되지 않습니다.</p>
        <button autoFocus type="button" onClick={onLogin} className="mt-6 rounded-lg bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700">확인 · 로그인 화면으로</button>
      </div>
    </div>
  );
}
