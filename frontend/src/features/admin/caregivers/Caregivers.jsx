import { useState } from "react";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { WEEK_LIMIT } from "../../../constants";
import { useCenter, inCenter } from "../../../context/CenterContext";
import { centers } from "../../../data/centers";
import { caregivers } from "../../../data/caregivers";
import CaregiverRecord from "./CaregiverRecord";

export default function Caregivers() {
  const [record, setRecord] = useState(null);
  const center = useCenter();
  const visible = caregivers.filter(inCenter(center));
  return (
    <div className="space-y-5">
      <SectionTitle title="요양보호사 관리" subtitle="선택한 센터에 등록된 근무 인력입니다. 주 52시간 근로기준을 기준으로 근무시간을 관리합니다." action={<button className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">+ 요양보호사 등록</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((c) => {
          const pct = Math.min(100, (c.week / WEEK_LIMIT) * 100);
          const bar = c.week >= WEEK_LIMIT ? "bg-red-500" : c.week >= 48 ? "bg-amber-500" : "bg-teal-500";
          return (
            <Panel key={c.id} className="p-5 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-teal-100 font-display text-lg font-bold text-teal-700">{c.name[0]}</div>
                  <div><b className="text-slate-900">{c.name}</b><p className="mt-0.5 text-xs text-slate-400">{c.gender} · {c.area}{center === "all" && ` · ${centers.find((x) => x.id === c.center)?.short}`}</p></div>
                </div>
                <Badge tone={c.tone}>{c.status}</Badge>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">근무 가능 요일 · <b className="text-slate-700">{c.days}</b></div>
              <div className="mt-4">
                <div className="flex items-end justify-between"><span className="text-[11px] text-slate-400">이번 주 근무시간</span><b className={`font-mono text-sm ${c.week >= WEEK_LIMIT ? "text-red-600" : c.week >= 48 ? "text-amber-600" : "text-slate-800"}`}>{c.week} / {WEEK_LIMIT}시간</b></div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="mt-4 grid grid-cols-2 divide-x divide-slate-100 text-center">
                <div><b className="font-mono text-lg text-slate-800">{c.month}</b><p className="text-[11px] text-slate-400">이번 달 배정 건수</p></div>
                <div><b className="font-mono text-lg text-slate-800">{c.area.split("·").length}</b><p className="text-[11px] text-slate-400">활동 가능 지역</p></div>
              </div>
              <button onClick={() => setRecord(c)} className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">근무 기록 보기</button>
            </Panel>
          );
        })}
      </div>
      {visible.length === 0 && <Panel className="p-10 text-center text-sm text-slate-400">선택한 센터에 등록된 요양보호사가 없습니다.</Panel>}
      {record && <CaregiverRecord c={record} onClose={() => setRecord(null)} />}
    </div>
  );
}
