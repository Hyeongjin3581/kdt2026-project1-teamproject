import { Link } from "react-router-dom";

export default function Signup() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">회원가입</h1>
        <p className="mt-2 text-sm text-slate-500">회원가입 화면이 아직 준비되지 않았습니다.</p>
        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          백엔드 연결 전까지는 임시 화면입니다.
        </div>
        <Link to="/login" className="mt-6 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white">
          로그인으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
