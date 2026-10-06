import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";

// items는 서버 연결 후 API 모듈에서 변환할 표시용 배열입니다. 예시 알림을 생성하지 않습니다.
export default function ScheduleChangeNotifications({ items = [], loading = false, error = "", connected = false, onRetry }) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">일정 변경 알림</h2>{onRetry && <button type="button" disabled={loading} onClick={onRetry} className="text-xs font-bold text-teal-700 disabled:opacity-50">새로고침</button>}</div>
      {loading ? <p role="status" className="p-8 text-center text-sm text-slate-500">알림을 불러오는 중입니다.</p> : error ? <div role="alert" className="p-5 text-sm text-rose-600"><p>{error}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-2 font-bold underline">다시 불러오기</button>}</div> : items.length === 0 ? <p role="status" className="p-8 text-center text-sm text-slate-500">도착한 일정 변경 알림이 없습니다.</p> : <ul className="divide-y divide-slate-100">{items.map((item) => <li key={item.notificationNo} className="space-y-2 px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-800">{item.message || `${item.recipientName || "수급자"}님의 방문 일정 변경 요청이 있습니다.`}</p>{item.status && <Badge>{item.status}</Badge>}</div>{(item.originalDate || item.originalTime) && <p className="text-xs text-slate-500">기존 일정: {item.originalDate} {item.originalTime}</p>}{(item.requestedDate || item.requestedTime) && <p className="text-xs font-semibold text-teal-700">변경 요청: {item.requestedDate} {item.requestedTime}</p>}</li>)}</ul>}
      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-5 text-slate-500"><p>보호자·요양보호사 요청 → 센터 관리자 확인 → 일정 확정</p>{!connected && <p>알림 API 연결 대기 중입니다. 실제 요청이 전달되면 이곳에서 확인할 수 있습니다.</p>}</div>
    </Panel>
  );
}
