import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { dot } from "../../../components/common/dot";
import { WEEK_LIMIT } from "../../../constants";
import { useCenter, inCenter } from "../../../context/CenterContext";
import { centers } from "../../../data/centers";
import { caregivers } from "../../../data/caregivers";
import { guardians } from "../../../data/guardians";
import { recipients } from "../../../data/recipients";
import { assignments, todayVisits, vacancyEvents } from "../../../data/schedules";

export default function Dashboard({ go }) {
  const alerts = [];
  const center = useCenter();
  const centerCaregivers = caregivers.filter(inCenter(center));
  const overLimit = centerCaregivers.filter((c) => c.week >= 48);
  const visits = todayVisits.filter(inCenter(center));
  const centerAssignments = assignments.filter(inCenter(center));
  const assignedCount = centerAssignments.filter((item) => item.state === "assigned").length;
  const unassignedCount = centerAssignments.filter((item) => item.state === "unassigned").length;
  const reviewCount = centerAssignments.filter((item) => item.state === "review").length;
  const vacancyCount = vacancyEvents.filter(inCenter(center)).length;
  const registrationCount = (items) => items.filter(inCenter(center)).length;
  const completionRate = centerAssignments.length ? Math.round((assignedCount / centerAssignments.length) * 100) : 0;
  return (
    <div className="space-y-5">
      <SectionTitle title="오늘의 운영 현황" subtitle="센터 운영 상황을 한눈에 확인하고 바로 업무를 처리하세요." action={<button onClick={() => go("auto")} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">✦ 다음 주 자동편성</button>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["오늘 방문 예정", visits.length, "건", "info", "일정", "schedule"],
          ["등록 요양보호사", centerCaregivers.length, "명", "neutral", "인력", "caregivers"],
          ["미배정 일정", unassignedCount, "건", "warning", "편성", "auto"],
          ["결원 / 대체 필요", vacancyCount, "건", "danger", "결원", "vacancy"],
        ].map(([label, value, unit, tone, tag, target]) => (
          <button key={label} onClick={() => go(target)} className="text-left">
            <Panel className="p-4 transition hover:shadow-md">
              <Badge tone={tone}>{tag}</Badge>
              <div className="mt-4 flex items-end gap-1"><b className="font-display text-3xl text-slate-900">{value}</b><span className="mb-1 text-sm text-slate-500">{unit}</span></div>
              <p className="mt-1 text-xs font-medium text-slate-600">{label}</p>
            </Panel>
          </button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.85fr]">
        <div className="space-y-5">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <div><h2 className="font-display font-bold text-slate-900">자동편성 진행 상태</h2><p className="mt-0.5 text-xs text-slate-400">등록된 배정 데이터 기준</p></div>
              <button onClick={() => go("auto")} className="text-xs font-semibold text-teal-600 hover:underline">초안 확인 →</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 px-3 py-3"><p className="text-[11px] text-slate-400">전체 일정</p><b className="font-mono text-lg text-slate-800">{centerAssignments.length}건</b></div>
              <div className="rounded-lg bg-slate-50 px-3 py-3"><p className="text-[11px] text-slate-400">자동배정</p><b className="font-mono text-lg text-slate-800">{assignedCount}건</b></div>
              <div className="rounded-lg bg-slate-50 px-3 py-3"><p className="text-[11px] text-slate-400">미배정</p><b className="font-mono text-lg text-slate-800">{unassignedCount}건</b></div>
              <div className="rounded-lg bg-slate-50 px-3 py-3"><p className="text-[11px] text-slate-400">확인 필요</p><b className="font-mono text-lg text-slate-800">{reviewCount}건</b></div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${completionRate}%` }} /></div>
            <p className="mt-2 text-[11px] text-slate-400">자동배정 완료율 {completionRate}%</p>
          </Panel>
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 className="font-display font-bold text-slate-900">주 52시간 초과 위험 요양보호사</h2><p className="mt-0.5 text-xs text-slate-400">근로기준법 기준 · 이번 주 근무시간</p></div>
              <button onClick={() => go("caregivers")} className="text-xs font-semibold text-teal-600 hover:underline">인력 관리 →</button>
            </div>
            <div className="divide-y divide-slate-100">
              {overLimit.map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">{c.name[0]}</div>
                  <b className="flex-1 text-sm text-slate-800">{c.name} <span className="font-normal text-slate-400">요양보호사</span></b>
                  <div className="w-28"><div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${c.week >= WEEK_LIMIT ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${Math.min(100, (c.week / WEEK_LIMIT) * 100)}%` }} /></div></div>
                  <b className={`w-16 text-right font-mono text-sm ${c.week >= WEEK_LIMIT ? "text-red-600" : "text-amber-600"}`}>{c.week}/{WEEK_LIMIT}h</b>
                </div>
              ))}
              {overLimit.length === 0 && <p className="px-5 py-6 text-center text-xs text-slate-400">근무시간 데이터가 없습니다.</p>}
            </div>
          </Panel>
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 className="font-display font-bold text-slate-900">오늘의 방문 일정</h2><p className="mt-0.5 text-xs text-slate-400">시간순 · 총 {visits.length}건{center === "all" && " · 전체 센터"}</p></div>
              <button onClick={() => go("schedule")} className="text-xs font-semibold text-teal-600 hover:underline">주간 일정 보기 →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400"><tr>{["방문 시간", "수급자", "지역", "담당 요양보호사", "소속 센터"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.t + v.name} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-mono text-slate-700">{v.t}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{v.name} <span className="text-xs font-normal text-slate-400">수급자</span></td>
                      <td className="px-5 py-4 text-slate-600">{v.area}</td>
                      <td className="px-5 py-4 text-slate-700">{v.cg}</td>
                      <td className="px-5 py-4"><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{centers.find((c) => c.id === v.center)?.short}</span></td>
                    </tr>
                  ))}
                  {visits.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">조회된 방문 일정이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">처리해야 할 알림</h2><p className="mt-0.5 text-xs text-slate-400">클릭하면 관리 화면으로 이동합니다</p></div>
            <div className="space-y-1 p-3">
              {alerts.map(([tone, tag, body, target]) => (
                <button key={body} onClick={() => go(target)} className="flex w-full gap-3 rounded-lg p-3 text-left transition hover:bg-slate-50">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot(tone)}`} />
                  <div className="flex-1"><div className={`text-xs font-bold ${tone === "danger" ? "text-red-600" : tone === "warning" ? "text-amber-600" : "text-teal-600"}`}>[{tag}]</div><div className="mt-1 text-xs leading-5 text-slate-600">{body}</div></div>
                  <span className="mt-0.5 text-slate-300">›</span>
                </button>
              ))}
              {alerts.length === 0 && <p className="px-3 py-5 text-center text-xs text-slate-400">처리할 알림이 없습니다.</p>}
            </div>
          </Panel>
          <Panel className="p-5">
            <h2 className="font-display font-bold text-slate-900">등록 현황</h2>
            <p className="mt-0.5 text-xs text-slate-400">선택한 센터 기준</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-teal-50/60 px-3 py-4 text-center"><b className="font-display text-2xl text-teal-700">{registrationCount(guardians)}</b><p className="mt-1 text-[11px] text-slate-500">보호자</p></div>
              <div className="rounded-lg bg-emerald-50/60 px-3 py-4 text-center"><b className="font-display text-2xl text-emerald-700">{registrationCount(recipients)}</b><p className="mt-1 text-[11px] text-slate-500">수급자</p></div>
            </div>
            <button onClick={() => go("guardians")} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">보호자 관리로 이동</button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
