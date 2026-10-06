//
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { dot } from "../../../components/common/dot";
import { WEEK_LIMIT } from "../../../constants";
import { useCenter, inCenter } from "../../../context/CenterContext";
import LoadStatus from "../../../components/common/LoadStatus";
import { buildAdminModel, emptyModel, emptyRaw } from "../../../utils/adminAdapters";

export default function Dashboard() {
  const navigate = useNavigate();
  const go = (id) => navigate(`/admin/${id}`);
  const [model, setModel] = useState(emptyModel);
  const [status, setStatus] = useState("loading");

  // 대시보드 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    setStatus("loading");
    try {
      const [centersRes, careworkersRes, guardiansRes, recipientsRes] = await Promise.all([
        axios.get("http://localhost:8080/center", { withCredentials: true }),
        axios.get("http://localhost:8080/api/careworkers", { withCredentials: true }),
        axios.get("http://localhost:8080/guardian", { withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }),
      ]);
      // 수급자별 방문 요청, 센터별 근무기록
      const [requestLists, reportLists] = await Promise.all([
        Promise.all(recipientsRes.data.map((r) =>
          axios.get("http://localhost:8080/request/carerecipient", { params: { carerecipient_no: r.careRecipientNo }, withCredentials: true }).catch(() => ({ data: [] }))
        )),
        Promise.all(centersRes.data.map((c) => c.centerNo).map((no) =>
          axios.get("http://localhost:8080/careworkerreport/center", { params: { center_no: no }, withCredentials: true }).catch(() => ({ data: [] }))
        )),
      ]);
      setModel(buildAdminModel({
        ...emptyRaw,
        centers: centersRes.data, careworkers: careworkersRes.data, guardians: guardiansRes.data, recipients: recipientsRes.data,
        requests: requestLists.flatMap((res) => res.data),
        reports: reportLists.flatMap((res) => res.data),
      }));
      setStatus("ok");
    } catch (error) {
      console.error("대시보드 조회 실패:", error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, []);
  const { centers, caregivers, todayVisits, assignments, vacancyEvents, guardians, recipients } = model;
  const center = useCenter();
  const overLimit = caregivers.filter(inCenter(center)).filter((c) => c.week >= 48);
  const visits = todayVisits.filter(inCenter(center));
  const plans = assignments.filter(inCenter(center));
  const vacancies = vacancyEvents.filter(inCenter(center)).filter((e) => e.kind === "vacancy");
  const assignedCount = plans.filter((a) => a.state === "assigned").length;
  const unassignedCount = plans.filter((a) => a.state === "unassigned").length;
  const reviewCount = plans.filter((a) => a.state === "pending").length; // 수락 대기
  const rate = plans.length ? Math.round((assignedCount / plans.length) * 100) : 0;
  const workingToday = new Set(visits.map((v) => v.cg)).size;
  const alerts = [
    ...vacancies.map((e) => ["danger", "긴급", `${e.dateLabel} ${e.time} ${e.recipient} 수급자 방문에 결원이 발생했습니다. 대체자 지정이 필요합니다.`, "vacancy"]),
    ...overLimit.map((c) => ["warning", "주의", `${c.name} 요양보호사의 이번 주 근무시간이 ${c.week}시간입니다. 주 ${WEEK_LIMIT}시간 기준을 확인하세요.`, "caregivers"]),
    ...(unassignedCount > 0 ? [["warning", "미배정", `방문 일정 중 ${unassignedCount}건이 아직 배정되지 않았습니다.`, "requests"]] : []),
  ];
  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} />;
  return (
    <div className="space-y-5">
      <SectionTitle title="오늘의 운영 현황" subtitle="센터 운영 상황을 한눈에 확인하고 바로 업무를 처리하세요." action={<button onClick={() => go("auto")} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">✦ 다음 주 자동편성</button>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["오늘 방문 예정", String(visits.length), "건", "info", "TODAY", "schedule"],
          ["오늘 근무 요양보호사", String(workingToday), "명", "neutral", "출근", "caregivers"],
          ["미배정 일정", String(unassignedCount), "건", "warning", "확인 필요", "requests"],
          ["긴급 결원 / 대체 필요", String(vacancies.length), "건", "danger", "즉시 처리", "vacancy"],
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
              <div><h2 className="font-display font-bold text-slate-900">방문 일정 배정 현황</h2><p className="mt-0.5 text-xs text-slate-400">방문 요청 기준</p></div>
              <button onClick={() => go("requests")} className="text-xs font-semibold text-teal-600 hover:underline">요청 관리 →</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["전체 일정", `${plans.length}건`], ["배정 완료", `${assignedCount}건`], ["미배정", `${unassignedCount}건`], ["수락 대기", `${reviewCount}건`]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-slate-50 px-3 py-3"><p className="text-[11px] text-slate-400">{l}</p><b className="font-mono text-lg text-slate-800">{v}</b></div>
              ))}
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${rate}%` }} /></div>
            <p className="mt-2 text-[11px] text-slate-400">배정 완료율 {rate}%</p>
          </Panel>
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 className="font-display font-bold text-slate-900">주 52시간 초과 위험 요양보호사</h2><p className="mt-0.5 text-xs text-slate-400">근로기준법 기준 · 이번 주 근무시간</p></div>
              <button onClick={() => go("caregivers")} className="text-xs font-semibold text-teal-600 hover:underline">인력 관리 →</button>
            </div>
            <div className="divide-y divide-slate-100">
              {overLimit.length === 0 && <p className="px-5 py-6 text-center text-sm text-slate-400">주 {WEEK_LIMIT}시간 초과 위험 요양보호사가 없습니다.</p>}
              {overLimit.map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">{c.name[0]}</div>
                  <b className="flex-1 text-sm text-slate-800">{c.name} <span className="font-normal text-slate-400">요양보호사</span></b>
                  <div className="w-28"><div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${c.week >= WEEK_LIMIT ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${Math.min(100, (c.week / WEEK_LIMIT) * 100)}%` }} /></div></div>
                  <b className={`w-16 text-right font-mono text-sm ${c.week >= WEEK_LIMIT ? "text-red-600" : "text-amber-600"}`}>{c.week}/{WEEK_LIMIT}h</b>
                </div>
              ))}
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
                  {visits.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">오늘 예정된 방문이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">처리해야 할 알림</h2><p className="mt-0.5 text-xs text-slate-400">클릭하면 관리 화면으로 이동합니다</p></div>
            <div className="space-y-1 p-3">
              {alerts.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-400">처리할 알림이 없습니다.</p>}
              {alerts.map(([tone, tag, body, target]) => (
                <button key={body} onClick={() => go(target)} className="flex w-full gap-3 rounded-lg p-3 text-left transition hover:bg-slate-50">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot(tone)}`} />
                  <div className="flex-1"><div className={`text-xs font-bold ${tone === "danger" ? "text-red-600" : tone === "warning" ? "text-amber-600" : "text-teal-600"}`}>[{tag}]</div><div className="mt-1 text-xs leading-5 text-slate-600">{body}</div></div>
                  <span className="mt-0.5 text-slate-300">›</span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel className="p-5">
            <h2 className="font-display font-bold text-slate-900">보호자 / 수급자 등록 현황</h2>
            <p className="mt-0.5 text-xs text-slate-400">전체</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-teal-50/60 px-3 py-4 text-center"><b className="font-display text-2xl text-teal-700">{guardians.filter(inCenter(center)).length}</b><p className="mt-1 text-[11px] text-slate-500">보호자</p></div>
              <div className="rounded-lg bg-emerald-50/60 px-3 py-4 text-center"><b className="font-display text-2xl text-emerald-700">{recipients.filter(inCenter(center)).length}</b><p className="mt-1 text-[11px] text-slate-500">수급자</p></div>
            </div>
            <button onClick={() => go("guardians")} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">보호자 관리로 이동</button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
