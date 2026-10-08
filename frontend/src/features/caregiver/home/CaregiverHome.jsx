import { useEffect, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import LoadStatus from "../../../components/common/LoadStatus";
import CaregiverPageTitle from "../CaregiverPageTitle";
import { buildVisits, dateLabel, todayIso } from "../../../utils/caregiverAdapters";
import { toHhmm } from "../../../utils/timeFormat";

// 요양보호사 홈 : 수락 대기 건수, 소속 센터, 오늘·다가오는 확정 방문, 등록한 가용시간 요약
export default function CaregiverHome({ careworker, center, go }) {
  const [visits, setVisits] = useState([]);           // 확정된 방문 (오늘 이후)
  const [pendingCount, setPendingCount] = useState(0); // 수락 대기 배정 건수
  const [availability, setAvailability] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);

  // 홈 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    setLoadError(null);
    try {
      const [mineRes, recipientsRes, availabilityRes] = await Promise.all([
        axios.get("http://localhost:8080/careworkerreport/careworker", { params: { careworkerNo: careworker.careworkerNo }, withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }),
        axios.get("http://localhost:8080/api/caregiver-availability", { withCredentials: true }),
      ]);
      const requestLists = await Promise.all(recipientsRes.data.map((r) =>
        axios.get("http://localhost:8080/request/carerecipient", { params: { careRecipientNo: r.careRecipientNo }, withCredentials: true }).catch(() => ({ data: [] }))
      ));
      const upcoming = mineRes.data.filter((r) => r.workStatus === "확정" && r.workDate >= todayIso);
      setVisits(buildVisits({ reports: upcoming, requests: requestLists.flatMap((res) => res.data), recipients: recipientsRes.data }));
      setPendingCount(mineRes.data.filter((r) => r.workStatus === "배정").length);
      // 가용시간은 전체 조회만 있어서 내 번호(caregiverNo)로 거르고, 오늘 이후만 날짜순으로
      setAvailability(availabilityRes.data
        .filter((a) => a.caregiverNo === careworker.careworkerNo && a.availableDate >= todayIso)
        .sort((a, b) => a.availableDate.localeCompare(b.availableDate) || a.startTime - b.startTime));
      setStatus("ok");
    } catch (error) {
      console.error("홈 데이터 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, [careworker.careworkerNo]);

  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  const todayVisits = visits.filter((v) => v.iso === todayIso);
  const laterVisits = visits.filter((v) => v.iso > todayIso);

  return (
    <div className="space-y-5">
      <CaregiverPageTitle title={`안녕하세요, ${careworker.careworkerName} 요양보호사님`} subtitle="수락할 배정과 다가오는 방문, 등록한 가용시간을 확인하세요." />

      <div className="grid gap-5 sm:grid-cols-2">
        <Panel className="p-5">
          <h2 className="font-display font-bold text-slate-900">수락 대기 배정</h2>
          <p className={`mt-4 font-display text-3xl font-extrabold ${pendingCount > 0 ? "text-amber-600" : "text-slate-400"}`}>{pendingCount}<span className="ml-1 text-sm font-bold">건</span></p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{pendingCount > 0 ? "센터에서 지정한 방문이 수락을 기다리고 있습니다." : "수락을 기다리는 배정이 없습니다."}</p>
          {pendingCount > 0 && <button onClick={() => go("schedule")} className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600">수락 / 거절하러 가기 →</button>}
        </Panel>
        <Panel className="p-5">
          <h2 className="font-display font-bold text-slate-900">소속 센터</h2>
          <p className="mt-4 text-lg font-bold text-teal-700">{center?.centerName ?? "소속 센터 정보 없음"}</p>
          {center && <dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-slate-400">센터 주소</dt><dd className="mt-1 break-words text-slate-700">{center.centerAddress || "-"}</dd></div><div><dt className="text-xs text-slate-400">연락처</dt><dd className="mt-1 text-slate-700">{center.centerPhonenumber || "-"}</dd></div></dl>}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_.85fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-display font-bold text-slate-900">오늘 · 다가오는 방문</h2><p className="mt-1 text-xs text-slate-400">{dateLabel(todayIso)} 기준 확정된 방문</p></div><button onClick={() => go("schedule")} className="text-xs font-bold text-teal-700 hover:underline">전체 보기 →</button></div>
          <div className="divide-y divide-slate-100">
            {[["오늘 방문", todayVisits], ["다가오는 방문", laterVisits]].map(([label, items]) => (
              <section key={label} className="p-5">
                <h3 className="text-sm font-bold text-slate-800">{label}</h3>
                {items.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">확정된 방문이 없습니다.</p> : (
                  <div className="mt-3 space-y-3">{items.slice(0, 3).map((v) => (
                    <div key={v.reportNo} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-xs font-bold text-teal-700">{v.date} · {v.time}</p><Badge tone="ok">확정</Badge></div>
                      <p className="mt-2 text-sm font-bold text-slate-900">{v.recipientName} 수급자</p>
                      <p className="mt-1 break-words text-xs leading-5 text-slate-500">{v.address}</p>
                    </div>
                  ))}</div>
                )}
              </section>
            ))}
          </div>
        </Panel>
        <Panel className="h-fit overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">등록한 가용시간</h2><button onClick={() => go("availability")} className="text-xs font-semibold text-teal-600 hover:underline">전체 관리 →</button></div>
          <div className="px-5 py-4">
            <p className="mb-3 text-xs text-slate-500">오늘 이후 {availability.length}건 · 최대 3건 표시</p>
            {availability.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">등록한 가용시간이 없습니다.</p> : (
              <div className="divide-y divide-slate-100">{availability.slice(0, 3).map((a) => (
                <div key={a.availabilityNo} className="flex items-center justify-between gap-2 py-3">
                  <div><p className="text-sm font-bold text-slate-800">{dateLabel(a.availableDate)}</p><p className="mt-1 font-mono text-xs text-slate-500">{toHhmm(a.startTime)} ~ {toHhmm(a.endTime)}</p></div>
                  <Badge tone={a.status === "근무가능" ? "ok" : "neutral"}>{a.status}</Badge>
                </div>
              ))}</div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
