import { useEffect, useState } from "react";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { useCenter, inCenter } from "../../../context/CenterContext";
import LoadStatus from "../../../components/common/LoadStatus";
import { buildCenters } from "../../../utils/adminAdapters";
import { toHhmm } from "../../../utils/timeFormat";

// 결원 관리 : 요양보호사가 배정을 거절하거나 확정 후 취소한 방문을 결원으로 보고,
// 해당 요양보호사를 제외한 대체 후보를 다시 추천받아 대체자를 지정한다.
const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m : 0(1월) ~ 11(12월)
const dateLabel = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일 (${DAY_KR[new Date(y, m - 1, d).getDay()]})`;
};

// 백엔드 결원 DTO → 화면에서 쓰는 형태
const toEvent = (v) => ({
  requestNo: v.requestNo,
  state: v.vacancyState, // 결원 : 대체자 미지정 / 대체요청중 : 대체자 수락 대기
  center: v.centerNo,
  iso: v.visitDate,
  recipient: v.careRecipientName ?? "-",
  area: (v.careRecipientAddress ?? "").replace(/^(서울특별시|경기도)\s*/, ""),
  dateLabel: dateLabel(v.visitDate),
  time: `${toHhmm(v.visitStartTime)}~${toHhmm(v.visitEndTime)}`,
  gender: v.preferredGender ?? "무관",
  content: v.requestContent ?? "",
  cancelledNames: v.cancelledCareworkerName ? v.cancelledCareworkerName.split(", ") : [], // "홍길동, 김철수" → 이름 배열
  urgent: v.urgent,
  hoursLeft: v.hoursLeft,
  startAt: new Date(`${v.visitDate}T${toHhmm(v.visitStartTime) || "00:00"}:00`), // 방문 시작 시각
});

// 방문 시작까지 1시간 이하로 남은 결원은 대체자를 구할 시간이 없으므로 화면에서 뺀다
const HIDE_BEFORE_MS = 60 * 60 * 1000;
const isOpenVacancy = (e, now) => {
  if (Number.isNaN(e.startAt.getTime())) return e.hoursLeft > 1; // 시각을 못 읽으면 서버의 남은 시간으로 판단
  return e.startAt.getTime() - now > HIDE_BEFORE_MS;
};

// 방문까지 남은 시간 표시 (24시간 이내면 긴급)
const deadlineText = (e) => {
  if (e.urgent) return `긴급 · ${e.hoursLeft}시간 남음`;
  return `방문까지 ${e.hoursLeft}시간`;
};

export default function Vacancy() {
  const center = useCenter();
  const [vacancies, setVacancies] = useState([]);
  const [centers, setCenters] = useState(buildCenters([]));
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [month, setMonth] = useState(() => { const now = new Date(); return { y: now.getFullYear(), m: now.getMonth() }; });
  const [selectedNo, setSelectedNo] = useState(null);
  const [candidates, setCandidates] = useState({ requestNo: null, loading: false, list: [], error: false });
  const [busyNo, setBusyNo] = useState(null);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => Date.now()); // 1분마다 갱신해 화면을 켜 둔 동안에도 임박한 결원을 뺀다
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60 * 1000); return () => clearInterval(timer); }, []);

  // 결원 목록 : GET /vacancy → [{ requestNo, vacancyState, careRecipientName, visitDate, visitStartTime, visitEndTime, centerNo, cancelledCareworkerName, urgent, hoursLeft, ... }]
  // 서버에서 긴급 결원 먼저, 방문이 빠른 순으로 정렬되어 온다. refresh 가 true 면 화면을 유지한 채 다시 불러온다.
  async function loadData(refresh = false) {
    if (!refresh) setStatus("loading");
    try {
      const [centersRes, vacancyRes] = await Promise.all([
        axios.get("/center", { withCredentials: true }),
        axios.get("http://localhost:8080/vacancy", { withCredentials: true }),
      ]);
      const list = vacancyRes.data.map(toEvent);
      setCenters(buildCenters(centersRes.data));
      setVacancies(list);
      // 처음 열 때는 가장 급한 결원이 있는 달을 보여 준다
      const firstOpen = list.find((e) => isOpenVacancy(e, Date.now()));
      if (!refresh && firstOpen) {
        const [y, m] = firstOpen.iso.split("-").map(Number);
        setMonth({ y, m: m - 1 });
      }
      setStatus("ok");
    } catch (error) {
      console.error("결원 관리 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, []);

  // 선택한 센터의 결원 중 보고 있는 달의 결원 (서버는 지난 날짜만 빼 주므로, 방문 시작까지 1시간 이하로 남은 결원은 여기서 뺀다)
  const events = vacancies.filter(inCenter(center)).filter((e) => isOpenVacancy(e, now));
  const monthPrefix = `${month.y}-${pad(month.m + 1)}`;
  const monthEvents = events.filter((e) => e.iso.startsWith(monthPrefix));
  const eventsOf = (d) => monthEvents.filter((e) => e.iso === toIso(month.y, month.m, d));
  const ev = monthEvents.find((e) => e.requestNo === selectedNo) ?? monthEvents[0] ?? null;
  const dayEvents = ev ? monthEvents.filter((e) => e.iso === ev.iso) : [];

  // 달력 칸 : 1일 앞의 빈칸 + 1일 ~ 말일
  const first = new Date(month.y, month.m, 1).getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const moveMonth = (n) => setMonth((cur) => { const d = new Date(cur.y, cur.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const select = (requestNo) => { setSelectedNo(requestNo); setMessage(""); };

  // 대체 후보 재추천 : GET /vacancy/detail?requestNo=번호 → 거절/취소한 요양보호사를 뺀 상위 3명 [{ careworkerNo, careworkerName, distanceKm, workCount, continuityCount, totalScore, ... }]
  // 대체요청중(대체자 수락 대기)인 결원은 서버가 빈 목록을 주므로 조회하지 않는다.
  const evNo = ev?.requestNo ?? null;
  const evState = ev?.state ?? null;
  useEffect(() => {
    if (evNo === null || evState !== "결원") { setCandidates({ requestNo: evNo, loading: false, list: [], error: false }); return; }
    let ignore = false; // 다른 결원을 고른 뒤 늦게 도착한 응답은 무시
    setCandidates({ requestNo: evNo, loading: true, list: [], error: false });
    axios.get("http://localhost:8080/vacancy/detail", { params: { requestNo: evNo }, withCredentials: true })
      .then((response) => { if (!ignore) setCandidates({ requestNo: evNo, loading: false, list: Array.isArray(response.data) ? response.data : [], error: false }); })
      .catch((error) => { console.error("대체 후보 조회 실패:", error); if (!ignore) setCandidates({ requestNo: evNo, loading: false, list: [], error: true }); });
    return () => { ignore = true; };
  }, [evNo, evState]);

  // 대체자 지정 : POST /careworkerreport/assign (body { requestNo, careworkerNo }) → 근무기록 '배정' + 요청 '배정중'
  // 지정한 요양보호사가 수락하면 결원 목록에서 빠지고, 거절하면 다시 결원으로 돌아온다.
  const assign = async (c) => {
    if (!ev) return;
    if (!window.confirm(`${c.careworkerName} 요양보호사를 ${ev.recipient} 수급자 ${ev.dateLabel} 방문의 대체자로 지정할까요?`)) return;
    setBusyNo(c.careworkerNo);
    try {
      const response = await axios.post("http://localhost:8080/careworkerreport/assign", { requestNo: ev.requestNo, careworkerNo: c.careworkerNo }, { withCredentials: true });
      if (response.data) {
        await loadData(true);
        setMessage(`${c.careworkerName} 요양보호사에게 대체 요청을 보냈습니다. 요양보호사가 수락하면 방문 일정이 확정됩니다.`);
      } else {
        alert("대체자 지정에 실패했습니다. 결원 상태를 다시 확인해주세요.");
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setBusyNo(null);
    }
  };

  if (status !== "ok") return <LoadStatus status={status} onRetry={() => loadData()} error={loadError} />;
  const centerShort = ev ? centers.find((c) => c.id === ev.center)?.short : null;
  const candidatesLoading = candidates.loading || candidates.requestNo !== evNo;
  return (
    <div className="space-y-5">
      <SectionTitle title="결원 관리" subtitle="요양보호사가 배정을 거절하거나 확정 후 취소한 방문을 결원으로 표시하고, 해당 요양보호사를 제외한 대체 후보를 거리·최근 근무량 기준으로 다시 추천합니다." />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => moveMonth(-1)} aria-label="이전 달" className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50">‹</button>
              <h2 className="font-display font-bold text-slate-900">{month.y}년 {month.m + 1}월</h2>
              <button onClick={() => moveMonth(1)} aria-label="다음 달" className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50">›</button>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />결원</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />대체요청중</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            {DAY_KR.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const list = eventsOf(d);
              const has = list.length > 0;
              const isSel = has && ev?.iso === toIso(month.y, month.m, d);
              const open = list.filter((e) => e.state === "결원").length; // 대체자 미지정
              const waiting = list.length - open;                          // 대체자 수락 대기
              return (
                <button key={i} onClick={() => has && select(list[0].requestNo)} disabled={!has}
                  className={`aspect-square rounded-lg border p-1 text-left transition ${isSel ? "border-teal-500 bg-teal-50 ring-1 ring-teal-300" : has ? "border-slate-200 hover:bg-slate-50" : "border-transparent text-slate-300"}`}>
                  <span className={`text-xs font-semibold ${has ? "text-slate-700" : "text-slate-300"}`}>{d}</span>
                  {open > 0 && <span className="mt-0.5 block rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold text-red-700">결원 {open}</span>}
                  {waiting > 0 && <span className="mt-0.5 block rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700">대체중 {waiting}</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">표시된 날짜를 선택하면 오른쪽에 결원 정보와 대체 후보 추천이 함께 표시됩니다. 방문까지 24시간 이내로 남은 결원은 긴급으로 표시됩니다. 방문 시작까지 1시간 이하로 남았거나 이미 지난 방문은 목록에서 제외됩니다.</p>
        </Panel>

        {ev ? (
          <div className="space-y-5">
            {dayEvents.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {dayEvents.map((e) => (
                  <button key={e.requestNo} onClick={() => select(e.requestNo)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${e.requestNo === ev.requestNo ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    {e.recipient} · {e.time}
                  </button>
                ))}
              </div>
            )}
            <Panel className="p-5">
              <div className="flex items-center justify-between">
                <Badge tone={ev.state === "결원" ? "danger" : "warning"}>{ev.state === "결원" ? "결원 발생" : "대체 요청중"}</Badge>
                <span className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold ${ev.urgent ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>{deadlineText(ev)}</span>
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-slate-900">{ev.recipient} 수급자 방문</h2>
              <p className="mt-1 text-sm text-slate-500">{ev.dateLabel} {ev.time} · {ev.area}{center === "all" && centerShort && ` · ${centerShort}`}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[["기존 담당", ev.cancelledNames.length > 0 ? `${ev.cancelledNames[ev.cancelledNames.length - 1]} 요양보호사` : "-"], ["선호 성별", ev.gender], ["방문 날짜", ev.dateLabel], ["방문 시간", ev.time]].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-[11px] text-slate-400">{l}</p><b className="text-slate-700">{v}</b></div>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2.5">
                <p className="text-[11px] font-bold text-red-700">결원 사유</p>
                <p className="mt-0.5 text-sm text-red-900">{ev.cancelledNames.join(", ")} 요양보호사가 배정을 거절했거나 확정 후 취소했습니다.</p>
                {ev.content && <p className="mt-1 text-xs text-red-800">요청 내용 : {ev.content}</p>}
              </div>
            </Panel>
            <Panel className="overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-display font-bold text-slate-900">대체 후보 재추천 <span className="text-sm font-normal text-slate-400">· 추천점수 순</span></h2>
                <p className="mt-1 text-[11px] text-slate-400">거절/취소한 요양보호사는 제외 · 거리 50점 + 최근 30일 근무량 30점 + 연속요양 20점</p>
              </div>
              <div className="divide-y divide-slate-100">
                {ev.state === "대체요청중" ? (
                  <p className="px-5 py-6 text-center text-sm text-slate-500">대체 요청을 보낸 요양보호사의 수락을 기다리는 중입니다.<br />수락하면 결원 목록에서 빠지고, 거절하면 다시 결원으로 돌아와 대체 후보를 추천합니다.</p>
                ) : candidatesLoading ? (
                  <p className="px-5 py-6 text-center text-sm text-slate-400">대체 후보를 찾는 중입니다...</p>
                ) : candidates.error ? (
                  <p className="px-5 py-6 text-center text-sm text-red-500">대체 후보를 불러오지 못했습니다. 수급자 주소(좌표)가 등록되어 있는지 확인해주세요.</p>
                ) : candidates.list.length === 0 ? (
                  <p className="px-5 py-6 text-center text-sm text-slate-400">추천할 대체 후보가 없습니다.<br />방문 날짜·시간에 근무 가능하고 선호 성별과 일정 조건을 만족하는 요양보호사가 없습니다.</p>
                ) : candidates.list.map((c, i) => (
                  <div key={c.careworkerNo} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`grid h-7 w-7 place-items-center rounded-full font-mono text-xs font-bold ${i === 0 ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                      <div className="min-w-28 flex-1">
                        <b className="text-sm text-slate-800">{c.careworkerName}</b>
                        <p className="text-[11px] text-slate-400">거리 {Number(c.distanceKm).toFixed(1)}km · 최근 30일 {c.workCount}회{c.continuityCount !== undefined ? ` · 연속요양 ${c.continuityCount}회` : ""}</p>
                      </div>
                      <b className="font-mono text-lg text-teal-600">{Number(c.totalScore).toFixed(1)}점</b>
                      <button onClick={() => assign(c)} disabled={busyNo !== null}
                        className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-700 disabled:opacity-50">
                        {busyNo === c.careworkerNo ? "지정 중..." : "대체자로 지정"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {message && <div className="m-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{message}</div>}
            </Panel>
          </div>
        ) : (
          <Panel className="grid place-items-center p-10 text-center text-sm text-slate-400">
            {events.length === 0 ? "현재 처리할 결원이 없습니다." : "이 달에는 결원이 없습니다. 이전/다음 달을 확인하세요."}
          </Panel>
        )}
      </div>
    </div>
  );
}
