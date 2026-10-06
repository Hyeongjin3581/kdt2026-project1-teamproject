import { Outlet } from "react-router-dom";

export default function GuardianApp({ logout }) {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="mb-6 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">보호자 앱</h1>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          로그아웃
        </button>
      </header>
      <Outlet />
    </div>
  );
}
