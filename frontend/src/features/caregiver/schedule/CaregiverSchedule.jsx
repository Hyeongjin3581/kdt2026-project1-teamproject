import { useState } from "react";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import CaregiverPageTitle from "../CaregiverPageTitle";
import ScheduleCancelRequestModal from "./ScheduleCancelRequestModal";

// 일정 API 연결 후 조회한 배열을 items로 전달합니다.
export default function CaregiverSchedule({ items = [], loading = false, error = "", onRetry, connected = false }) {
  const [date, setDate] = useState("");
  const [cancelItem, setCancelItem] = useState(null);
  const filtered = items.filter((item) => !date || item.visitDate === date);
  const timeText = (item) => `${item.startTime || "미정"} ~ ${item.endTime || "미정"}`;

  return (
    <div className="space-y-5">
      <CaregiverPageTitle title="확정 근무 일정" subtitle="센터에서 배정한 방문 날짜와 시간, 수급자와 방문 주소를 확인하세요." />
      <p className="rounded-xl border border-teal-100 bg-teal-50 px-5 py-3 text-sm leading-6 text-teal-800">근무 가능한 시간은 가용시간 메뉴에서 관리합니다. 확정 근무 시간은 직접 수정할 수 없으며, 변경·취소 요청은 센터 관리자 확인 후 확정됩니다.</p>
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-display font-bold text-slate-900">내 방문 일정</h2>
            {!loading && !error && <p className="mt-1 text-xs text-slate-500">{date || "전체 날짜"} · {filtered.length}건</p>}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-slate-600">방문 날짜
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1.5 block rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
            </label>
            <button type="button" onClick={() => setDate("")} disabled={!date} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">초기화</button>
            {onRetry && <button type="button" onClick={onRetry} disabled={loading} className="rounded-lg border border-teal-200 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-40">새로고침</button>}
          </div>
        </div>
        {loading ? <div role="status" className="px-5 py-16 text-center text-sm text-slate-500">방문 일정을 불러오는 중입니다...</div> : error ? (
          <div role="alert" className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-rose-600">방문 일정을 불러오지 못했습니다.</p>
            <p className="mt-2 text-xs text-slate-500">{typeof error === "string" ? error : "잠시 후 다시 시도해주세요."}</p>
            {onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700">다시 불러오기</button>}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{["방문 날짜", "시작 / 종료", "수급자", "방문 주소", "일정 / 방문 상태", "요청"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead>
                <tbody>{filtered.map((item) => (
                  <tr key={item.scheduleNo} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">{item.visitDate || "미정"}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs">{timeText(item)}</td>
                    <td className="px-5 py-4">{item.recipientName || "정보 없음"}</td>
                    <td className="max-w-xs break-words px-5 py-4 text-slate-600">{item.address || "주소 정보 없음"}</td>
                    <td className="px-5 py-4"><Badge>{item.status || "상태 정보 없음"}</Badge></td>
                    <td className="px-5 py-4"><button type="button" onClick={() => setCancelItem(item)} className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">근무 취소 요청</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">{filtered.map((item) => (
              <article key={item.scheduleNo} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-900">{item.visitDate || "날짜 미정"}</p><Badge>{item.status || "상태 정보 없음"}</Badge></div>
                <dl className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-slate-500">시간</dt><dd className="font-mono">{timeText(item)}</dd>
                  <dt className="text-slate-500">수급자</dt><dd>{item.recipientName || "정보 없음"}</dd>
                  <dt className="text-slate-500">주소</dt><dd className="break-words">{item.address || "주소 정보 없음"}</dd>
                </dl>
                <button type="button" onClick={() => setCancelItem(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">근무 취소 요청</button>
              </article>
            ))}</div>
            {filtered.length === 0 && <div role="status" className="px-5 py-14 text-center"><p className="text-sm font-semibold text-slate-600">{items.length === 0 ? "등록된 방문 일정이 없습니다." : "선택한 날짜에 방문 일정이 없습니다."}</p><p className="mt-2 text-xs text-slate-400">{items.length === 0 ? "배정된 일정이 등록되면 이곳에서 확인할 수 있습니다." : "다른 날짜를 선택하거나 날짜 필터를 초기화해주세요."}</p></div>}
          </>
        )}
        {!connected && <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-5 text-slate-500">서버 일정 API 연결 대기 중입니다. 연결 후 실제 배정 일정이 표시됩니다.</p>}
      </Panel>
      {cancelItem && <ScheduleCancelRequestModal item={cancelItem} onClose={() => setCancelItem(null)} />}
    </div>
  );
}
