import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import LoadStatus from "../../../components/common/LoadStatus";
import CaregiverPageTitle from "../CaregiverPageTitle";
import ScheduleChangeNotifications from "../schedule/ScheduleChangeNotifications";

export default function CaregiverHome({ careworker, approval, go, availability, schedule = { items: [], loading: false, error: "", connected: false }, center = { item: null, loading: false, error: "", connected: false }, notifications = {} }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const visits = [...schedule.items].filter((item) => item.visitDate >= today).sort((a, b) => a.visitDate.localeCompare(b.visitDate) || (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  const todayVisits = visits.filter((item) => item.visitDate === today);
  const upcoming = visits.filter((item) => item.visitDate > today);
  return (
    <div className="space-y-5">
      <CaregiverPageTitle title={`안녕하세요, ${careworker.careworkerName} 요양보호사님`} subtitle="소속 센터와 근무 정보, 등록한 가용시간을 확인하세요." />
      <ScheduleChangeNotifications {...notifications} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Panel className="p-5">
          <h2 className="font-display font-bold text-slate-900">근무 · 승인 상태</h2>
          <div className="mt-4"><Badge>{careworker.careworkerState || "근무 상태 미등록"}</Badge></div>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm"><dt className="text-slate-500">관리자 승인</dt><dd className="font-semibold text-slate-800">{approval?.approved === true ? "승인 완료" : approval?.approved === false ? "승인 대기" : "승인 정보가 없습니다."}</dd><dt className="text-slate-500">계정 이용</dt><dd className="text-slate-700">{approval?.canUse === true ? "이용 가능" : approval?.canUse === false ? "이용 제한" : "이용 상태 정보가 없습니다."}</dd></dl>
          <p className="mt-3 text-xs leading-5 text-slate-500">근무 정보 변경은 소속 센터에 문의해주세요.</p>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-display font-bold text-slate-900">소속 센터</h2>
          <p className="mt-4 text-lg font-bold text-teal-700">{center.item?.centerName || `센터 번호 ${careworker.centerNo}`}</p>
          {center.loading ? <p role="status" className="mt-3 text-sm text-slate-500">센터 정보를 불러오는 중입니다.</p> : center.error ? <div role="alert" className="mt-3 text-sm text-rose-600"><p>{center.error}</p><button onClick={center.onRetry} className="mt-2 font-semibold underline">다시 불러오기</button></div> : center.item ? <dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-slate-400">센터 주소</dt><dd className="mt-1 break-words text-slate-700">{center.item.address || "등록된 주소가 없습니다."}</dd></div><div><dt className="text-xs text-slate-400">연락처</dt><dd className="mt-1 text-slate-700">{center.item.phoneNumber || "등록된 연락처가 없습니다."}</dd></div></dl> : <p className="mt-3 text-sm text-slate-500">등록된 센터 상세 정보가 없습니다.</p>}
          {!center.connected && <p className="mt-3 text-xs text-slate-400">센터 상세 정보는 서버 연결 후 표시됩니다.</p>}
        </Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.85fr]">
        <div className="space-y-5">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">등록한 가용시간</h2><button onClick={() => go("availability")} className="text-xs font-semibold text-teal-600 hover:underline">전체 관리 →</button></div>
            {availability.status !== "ok" ? <LoadStatus status={availability.status} error={availability.error} onRetry={availability.onReload} /> : <div className="px-5 py-4">
              <p className="mb-3 text-xs text-slate-500">총 {availability.items.length}건 · 날짜순으로 최대 3건 표시</p>
              {availability.items.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">등록한 가용시간이 없습니다.</p> : <div className="divide-y divide-slate-100">{availability.items.slice(0, 3).map((item) => <div key={item.availabilityNo} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="text-sm font-bold text-slate-800">{item.availableDate}</p><p className="mt-1 text-xs text-slate-500">시작 {item.startTime} · 종료 {item.endTime} (정수값)</p></div><Badge>{item.status}</Badge></div>)}</div>}
            </div>}
          </Panel>
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-display font-bold text-slate-900">오늘 · 다가오는 방문 일정</h2><p className="mt-1 text-xs text-slate-400">{today}</p></div><button onClick={() => go("schedule")} className="text-xs font-bold text-teal-700 hover:underline">전체 보기 →</button></div>
            {schedule.loading ? <p role="status" className="px-5 py-10 text-center text-sm text-slate-500">방문 일정을 불러오는 중입니다.</p> : schedule.error ? <div role="alert" className="p-5 text-center text-sm text-rose-600"><p>{schedule.error}</p><button onClick={schedule.onRetry} className="mt-3 font-bold underline">다시 불러오기</button></div> : <div className="divide-y divide-slate-100">
              {[["오늘 방문", todayVisits], ["다가오는 방문", upcoming]].map(([label, items]) => <section key={label} className="p-5"><h3 className="text-sm font-bold text-slate-800">{label}</h3>{items.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">등록된 방문 일정이 없습니다.</p> : <div className="mt-3 space-y-3">{items.slice(0, 3).map((item) => <div key={item.scheduleNo} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-xs font-bold text-teal-700">{item.visitDate} · {item.startTime || "시간 미등록"} ~ {item.endTime || "시간 미등록"}</p><Badge>{item.status || "상태 미등록"}</Badge></div><p className="mt-2 text-sm font-bold text-slate-900">{item.recipientName || "수급자 미등록"}</p><p className="mt-1 break-words text-xs leading-5 text-slate-500">{item.address || "등록된 방문 주소가 없습니다."}</p></div>)}</div>}</section>)}
            </div>}
            {!schedule.connected && <p className="px-5 pb-4 text-xs text-slate-400">방문 일정은 서버 일정 API 연결 후 표시됩니다.</p>}
          </Panel>
        </div>
        <Panel className="h-fit p-5">
          <h2 className="font-display font-bold text-slate-900">빠른 이동</h2>
          <div className="mt-3 space-y-2">{[["availability", "가용시간 관리", "근무 가능한 날짜와 시간 등록"], ["schedule", "방문 일정", "방문 시간과 수급자·주소 확인"], ["records", "업무 기록", "방문 업무와 특이사항 작성"], ["profile", "내 정보", "개인 정보와 근무 정보 확인"]].map(([id, title, subtitle]) => <button key={id} onClick={() => go(id)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"><div><p className="text-sm font-bold text-slate-800">{title}</p><p className="mt-1 text-[11px] text-slate-400">{subtitle}</p></div><span className="text-slate-300">›</span></button>)}</div>
        </Panel>
      </div>
    </div>
  );
}
