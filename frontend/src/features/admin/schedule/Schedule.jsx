import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import { useCenter, inCenter } from "../../../context/CenterContext";
import LoadStatus from "../../../components/common/LoadStatus";
import { buildAdminModel, emptyModel, emptyRaw } from "../../../utils/adminAdapters";
import { toMin, conflictSet } from "../../../utils/scheduleUtils";
import { WEEK_START } from "../../../constants";

// weekStart(월요일)에서 n 주 떨어진 월요일 : "2026-10-05" + 1 -> "2026-10-12"
const shiftWeek = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n * 7);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};
// 그 주(월~토) 날짜 범위 라벨 : "10.05~10.10"
const weekLabelOf = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const fmt = (dt) => `${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
  return `${fmt(new Date(y, m - 1, d))}~${fmt(new Date(y, m - 1, d + 5))}`;
};

// 근무기록 상태별 표시 : 배정(요양보호사 수락 대기) / 확정(수락) / 완료(방문 끝남)
const visitStyle = (st) => ({
  배정: { label: "수락 대기", box: "border-amber-400 bg-amber-50/80", time: "text-amber-700", tag: "bg-amber-100 text-amber-700" },
  확정: { label: "확정", box: "border-emerald-500 bg-emerald-50/70", time: "text-teal-700", tag: "bg-emerald-100 text-emerald-700" },
  완료: { label: "완료", box: "border-slate-400 bg-slate-50", time: "text-slate-500", tag: "bg-slate-200 text-slate-600" },
}[st] ?? { label: st ?? "", box: "border-emerald-500 bg-emerald-50/70", time: "text-teal-700", tag: "bg-slate-100 text-slate-500" });

export default function Schedule() {
  const center = useCenter();
  const [raw, setRaw] = useState(null); // 서버에서 받은 원본 목록
  const [weekOffset, setWeekOffset] = useState(0); // 0 = 이번 주, -1 = 지난주, 1 = 다음 주
  const weekStart = shiftWeek(WEEK_START, weekOffset);
  const model = useMemo(() => (raw ? buildAdminModel(raw, { weekStart }) : emptyModel), [raw, weekStart]);
  const [status, setStatus] = useState("loading");

  // 방문 일정 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    setStatus("loading");
    try {
      const [centersRes, careworkersRes, recipientsRes] = await Promise.all([
        axios.get("http://localhost:8080/center", { withCredentials: true }),
        axios.get("http://localhost:8080/api/careworkers", { withCredentials: true }),
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
      setRaw({
        ...emptyRaw,
        centers: centersRes.data, careworkers: careworkersRes.data, recipients: recipientsRes.data,
        requests: requestLists.flatMap((res) => res.data),
        reports: reportLists.flatMap((res) => res.data),
      });
      setStatus("ok");
    } catch (error) {
      console.error("방문 일정 조회 실패:", error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, []);
  const { centers, scheduleDays, weekTable } = model;
  const rows = weekTable.filter(inCenter(center));
  const conflictCount = rows.reduce((n, r) => n + r.cells.reduce((m, cell) => m + (conflictSet(cell).size > 0 ? 1 : 0), 0), 0);
  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} />;
  return (
    <div className="space-y-5">
      <SectionTitle title="방문 일정" subtitle="요양보호사별 주간 타임테이블입니다. 같은 시간대에도 여러 요양보호사가 각각 다른 수급자를 방문할 수 있습니다." />
      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            <button type="button" onClick={() => setWeekOffset((w) => w - 1)} aria-label="이전 주" className="px-3 py-2 hover:bg-slate-50">◀</button>
            <span className="min-w-[170px] border-x border-slate-200 px-3 py-2 text-center">{weekOffset === 0 ? "이번 주" : weekOffset < 0 ? `${-weekOffset}주 전` : `${weekOffset}주 후`} ({weekLabelOf(weekStart)})</span>
            <button type="button" onClick={() => setWeekOffset((w) => w + 1)} aria-label="다음 주" className="px-3 py-2 hover:bg-slate-50">▶</button>
          </div>
          {weekOffset !== 0 && <button type="button" onClick={() => setWeekOffset(0)} className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100">이번 주로</button>}
          <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />수락 대기</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />확정</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" />완료</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />시간 충돌</span>
            {conflictCount > 0
              ? <span className="rounded-md bg-red-50 px-2 py-1 font-bold text-red-600">시간 충돌 {conflictCount}건</span>
              : <span className="rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-600">충돌 없음</span>}
          </div>
        </div>
      </Panel>
      <Panel className="overflow-x-auto">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[132px_repeat(6,1fr)] border-b border-slate-100 bg-slate-50 text-center text-xs font-bold text-slate-500">
            <div className="px-3 py-3 text-left">요양보호사</div>
            {scheduleDays.map((d) => <div key={d} className="px-3 py-3">{d}</div>)}
          </div>
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[132px_repeat(6,1fr)] border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-2 border-r border-slate-100 px-3 py-4">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{row.cg[0]}</div>
                <div><b className="block text-xs text-slate-700">{row.cg}</b>{center === "all" && <span className="text-[10px] text-slate-400">{centers.find((c) => c.id === row.center)?.short}</span>}</div>
              </div>
              {row.cells.map((visits, i) => {
                const bad = conflictSet(visits);
                const sorted = visits.map((v, idx) => ({ v, conflict: bad.has(idx) })).sort((a, b) => toMin(a.v.t.split("~")[0]) - toMin(b.v.t.split("~")[0]));
                return (
                  <div key={i} className="min-h-[84px] space-y-1.5 border-r border-slate-100 p-2 last:border-0">
                    {sorted.map(({ v, conflict }, j) => (
                      <div key={j} className={`rounded-lg border-l-4 p-2 text-[11px] ${conflict ? "border-red-500 bg-red-50" : visitStyle(v.st).box}`}>
                        <div className="flex items-center justify-between">
                          <b className={`font-mono text-[10px] ${conflict ? "text-red-600" : visitStyle(v.st).time}`}>{v.t}</b>
                          {conflict ? <span className="rounded bg-red-100 px-1 text-[9px] font-bold text-red-600">충돌</span> : <span className={`rounded px-1 text-[9px] font-bold ${visitStyle(v.st).tag}`}>{visitStyle(v.st).label}</span>}
                        </div>
                        <p className="mt-0.5 font-bold text-slate-800">{v.name} <span className="font-normal text-slate-400">수급자</span></p>
                        <p className="text-slate-500">{v.area}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
          {rows.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-400">선택한 센터에 등록된 요양보호사 일정이 없습니다.</div>}
        </div>
      </Panel>
      {conflictCount > 0
        ? <Panel className="border-red-200 bg-red-50 p-4 text-sm text-red-800"><b>진단 경고 · 시간 충돌 {conflictCount}건</b> — 수동 배정 변경 또는 일정 수정으로 동일 요양보호사에게 시간이 겹치는 방문이 발생했습니다. 담당자를 변경하거나 자동편성으로 재조정하세요.</Panel>
        : <Panel className="flex items-center gap-2 border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800"><span className="text-emerald-500">✓</span> 현재 시간 충돌이 없습니다. 수동으로 배정을 변경하거나 일정을 수정해 충돌이 생기면 진단 경고가 표시됩니다.</Panel>}
    </div>
  );
}
