import { useEffect, useState } from "react";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { useCenter, inCenter } from "../../../context/CenterContext";
import LoadStatus from "../../../components/common/LoadStatus";
import { buildAdminModel, emptyModel, emptyRaw } from "../../../utils/adminAdapters";

export default function Vacancy() {
  const center = useCenter();
  const [model, setModel] = useState(emptyModel);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);

  // 결원 관리 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    setStatus("loading");
    try {
      const [centersRes, careworkersRes, guardiansRes, recipientsRes] = await Promise.all([
        axios.get("/center", { withCredentials: true }),
        axios.get("/api/careworkers", { withCredentials: true }),
        axios.get("http://localhost:8080/guardian", { withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }),
      ]);
      // 수급자별 방문 요청, 센터별 근무기록
      const [requestLists, reportLists] = await Promise.all([
        Promise.all(recipientsRes.data.map((r) =>
          axios.get("/request/carerecipient", { params: { careRecipientNo: r.careRecipientNo }, withCredentials: true }).catch(() => ({ data: [] }))
        )),
        Promise.all(centersRes.data.map((c) => c.centerNo).map((no) =>
          axios.get("/careworkerreport/center", { params: { centerNo: no }, withCredentials: true }).catch(() => ({ data: [] }))
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
      console.error("결원 관리 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, []);
  const { centers, vacancyEvents } = model;
  const events = vacancyEvents.filter(inCenter(center));
  const [selected, setSelected] = useState(null);
  const [sent, setSent] = useState(null);
  const first = new Date(2026, 8, 1).getDay(); // 9월 1일 요일
  const daysInMonth = 30;
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const eventOf = (d) => events.find((e) => e.date === d);
  const ev = eventOf(selected) ?? events[0];

  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  return (
    <div className="space-y-5">
      <SectionTitle title="결원 관리" subtitle="결원 발생 시 해당 시간에 근무 가능한 미배정 요양보호사를 재검색하고, 기존 담당 경험·지역·업무량을 다시 계산해 대체 후보를 추천합니다." />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-900">2026년 9월</h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />결원</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />미배정</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const e = eventOf(d);
              const isSel = d === ev?.date;
              return (
                <button key={i} onClick={() => e && setSelected(d)} disabled={!e}
                  className={`aspect-square rounded-lg border p-1 text-left transition ${isSel && e ? "border-teal-500 bg-teal-50 ring-1 ring-teal-300" : e ? "border-slate-200 hover:bg-slate-50" : "border-transparent text-slate-300"}`}>
                  <span className={`text-xs font-semibold ${e ? "text-slate-700" : "text-slate-300"}`}>{d}</span>
                  {e && <span className={`mt-0.5 block rounded px-1 py-0.5 text-[9px] font-bold ${e.kind === "vacancy" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{e.kind === "vacancy" ? "결원" : "미배정"} {e.count}</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">표시된 날짜를 선택하면 오른쪽에 결원 정보와 대체 후보 추천이 함께 표시됩니다. 긴급 결원은 최대 24시간 이내 응답을 기준으로 합니다.</p>
        </Panel>

        {ev ? (
          <div className="space-y-5">
            <Panel className="p-5">
              <div className="flex items-center justify-between">
                <Badge tone={ev.kind === "vacancy" ? "danger" : "warning"}>{ev.kind === "vacancy" ? "결원 발생" : "미배정"}</Badge>
                {ev.deadline && <span className="rounded-lg bg-red-50 px-3 py-1.5 font-mono text-xs font-bold text-red-600">{ev.deadline}</span>}
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-slate-900">{ev.recipient} 수급자 방문</h2>
              <p className="mt-1 text-sm text-slate-500">{ev.dateLabel} {ev.time} · {ev.area}{center === "all" && ` · ${centers.find((c) => c.id === ev.center)?.short}`}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[["기존 담당", ev.cg === "미배정" ? "미배정" : `${ev.cg} 요양보호사`], ["지역", ev.area], ["방문 날짜", ev.dateLabel], ["방문 시간", ev.time]].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-[11px] text-slate-400">{l}</p><b className="text-slate-700">{v}</b></div>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2.5"><p className="text-[11px] font-bold text-red-700">결원 사유</p><p className="mt-0.5 text-sm text-red-900">{ev.reason}</p></div>
            </Panel>
            <Panel className="overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">대체 후보 재추천 <span className="text-sm font-normal text-slate-400">· 추천점수 순</span></h2></div>
              <div className="divide-y divide-slate-100">
                {ev.subs.length === 0 && <p className="px-5 py-6 text-center text-sm text-slate-400">추천할 대체 후보가 없습니다.</p>}
                {ev.subs.map((c, i) => (
                  <div key={c.name} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`grid h-7 w-7 place-items-center rounded-full font-mono text-xs font-bold ${i === 0 ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                      <div className="min-w-28 flex-1"><b className="text-sm text-slate-800">{c.name}</b></div>
                      <b className="font-mono text-lg text-teal-600">{c.score}점</b>
                      <button onClick={() => setSent(i)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${sent === i ? "bg-emerald-100 text-emerald-700" : "bg-teal-600 text-white hover:bg-teal-700"}`}>{sent === i ? "요청 전송됨 ✓" : "대체자로 지정"}</button>
                    </div>
                  </div>
                ))}
              </div>
              {sent !== null && ev.subs[sent] && <div className="m-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{ev.subs[sent].name} 요양보호사에게 대체 요청을 전송했습니다. 상태: <b>대체 요청중</b> — 수락 시 관리자가 최종 확정합니다.</div>}
            </Panel>
          </div>
        ) : (
          <Panel className="grid place-items-center p-10 text-center text-sm text-slate-400">왼쪽 캘린더에서 결원/미배정 날짜를 선택하세요.</Panel>
        )}
      </div>
    </div>
  );
}
