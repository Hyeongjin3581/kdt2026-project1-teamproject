import { useState } from "react";

// 계정 관리 모달 — 개인정보 수정 / 수급자 변경 / 계정 탈퇴 (+ 로그아웃)
export default function AccountModal({ onClose, onLogout }) {
  const [tab, setTab] = useState("info");
  const fieldCls = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const [saved, setSaved] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [recipientSaved, setRecipientSaved] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900">계정 관리</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-lg">✕</button>
        </div>
        {/* 탭 */}
        <div className="flex border-b border-slate-100">
          {[["info", "개인정보 수정"], ["recipient", "수급자 변경"], ["withdraw", "계정 탈퇴"]].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setSaved(false); setRecipientSaved(false); }}
              className={`flex-1 py-3 text-sm font-semibold transition ${tab === id ? "border-b-2 border-teal-600 text-teal-600" : "text-slate-400 hover:text-slate-700"}`}>
              {label}
            </button>
          ))}
        </div>
        {/* 콘텐츠 */}
        <div className="px-6 py-5">
          {tab === "info" && (
            saved ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-xl text-teal-600">✓</div>
                <p className="mt-3 text-sm font-semibold text-slate-800">개인정보가 수정되었습니다.</p>
                <button onClick={() => setSaved(false)} className="mt-4 text-xs text-teal-600 hover:underline">다시 수정하기</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-slate-600">이름<input className={fieldCls} defaultValue="이수현" /></label>
                  <label className="block text-xs font-semibold text-slate-600">연락처<input className={fieldCls} defaultValue="010-1234-5678" /></label>
                </div>
                <label className="block text-xs font-semibold text-slate-600">이메일<input type="email" className={fieldCls} defaultValue="lee.sh@family.kr" /></label>
                <label className="block text-xs font-semibold text-slate-600">비밀번호 변경 (새 비밀번호)<input type="password" className={fieldCls} placeholder="변경할 경우에만 입력" /></label>
                <label className="block text-xs font-semibold text-slate-600">비밀번호 확인<input type="password" className={fieldCls} placeholder="비밀번호를 한 번 더 입력" /></label>
                <div className="flex justify-end pt-1">
                  <button onClick={() => setSaved(true)} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">저장하기</button>
                </div>
              </div>
            )
          )}
          {tab === "recipient" && (
            recipientSaved ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-xl text-teal-600">✓</div>
                <p className="mt-3 text-sm font-semibold text-slate-800">수급자 연결이 변경되었습니다.</p>
                <p className="mt-1 text-xs text-slate-500">센터 승인 후 최종 반영됩니다.</p>
                <button onClick={() => setRecipientSaved(false)} className="mt-4 text-xs text-teal-600 hover:underline">다시 변경하기</button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">현재 연결된 어르신을 확인하거나 새 연결코드로 어르신을 변경할 수 있습니다.</p>
                <div className="rounded-lg border border-slate-200 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">현재 연결 수급자</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">김순자 어르신</p>
                  <p className="text-xs text-slate-400">안산시 본오동 · 요양 3등급</p>
                </div>
                <label className="block text-xs font-semibold text-slate-600">새 어르신 연결코드
                  <input className={fieldCls} placeholder="센터에서 받은 6자리 코드" maxLength={6} />
                </label>
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">수급자 변경은 센터 담당자 승인 후 반영됩니다. 기존 방문 일정과 기록은 유지됩니다.</p>
                <div className="flex justify-end">
                  <button onClick={() => setRecipientSaved(true)} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">변경 요청</button>
                </div>
              </div>
            )
          )}
          {tab === "withdraw" && (
            withdrawn ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-100 text-xl text-red-500">!</div>
                <p className="mt-3 text-sm font-semibold text-slate-800">탈퇴 요청이 접수되었습니다.</p>
                <p className="mt-1 text-xs text-slate-500">처리까지 영업일 기준 1~3일이 소요됩니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">탈퇴 시 모든 방문 기록, 요청 내역, 연결된 수급자 정보가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
                <label className="block text-xs font-semibold text-slate-600">탈퇴 사유
                  <select className={fieldCls}><option>서비스 이용 종료</option><option>어르신 돌봄 종료</option><option>개인정보 삭제 요청</option><option>기타</option></select>
                </label>
                <label className="block text-xs font-semibold text-slate-600">확인 문구 입력<span className="ml-1 font-normal text-slate-400">("탈퇴합니다" 라고 입력)</span>
                  <input className={fieldCls} placeholder="탈퇴합니다" />
                </label>
                <div className="flex justify-end">
                  <button onClick={() => setWithdrawn(true)} className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100">탈퇴 요청</button>
                </div>
              </div>
            )
          )}
        </div>
        {/* 하단 로그아웃 */}
        <div className="border-t border-slate-100 px-6 py-4">
          <button onClick={onLogout} className="w-full rounded-lg border border-red-100 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-50">로그아웃</button>
        </div>
      </div>
    </div>
  );
}
