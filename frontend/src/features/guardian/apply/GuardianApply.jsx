//
import { useState } from "react";
import HourSelect from "../../../components/common/HourSelect";
import { toServerTime } from "../../../utils/timeFormat";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { TODAY } from "../../../constants";
import { upcomingDates } from "../../../utils/upcomingDates";

export default function GuardianApply({ recipient, recipients, onSelectRecipient, onDone, onRegisterRecipient }) {
  const [applySent, setApplySent] = useState(false);
  const [content, setContent] = useState("");
  const [preferredGender, setPreferredGender] = useState("무관"); // 선호하는 요양보호사 성별 : 무관 / 여자 / 남자
  const [sentCount, setSentCount] = useState(0);
  const [message, setMessage] = useState("");
  const dates = upcomingDates(7);
  const [selectedDates, setSelectedDates] = useState([]); // 선택한 날짜 (yyyy-MM-dd)
  const [dateTimes, setDateTimes] = useState({}); // 날짜별 { start, end }
  const orderedDates = dates.filter((d) => selectedDates.includes(d.iso));
  const toggleDate = (iso) =>
    setSelectedDates((prev) => {
      if (prev.includes(iso)) {
        setDateTimes((t) => { const n = { ...t }; delete n[iso]; return n; });
        return prev.filter((x) => x !== iso);
      }
      setDateTimes((t) => (t[iso] ? t : { ...t, [iso]: { start: "09:00", end: "12:00" } }));
      return [...prev, iso];
    });
  const setDateTime = (iso, key, value) =>
    setDateTimes((t) => ({ ...t, [iso]: { ...(t[iso] ?? { start: "09:00", end: "12:00" }), [key]: value } }));
  // 선택한 날짜마다 방문 요청 1건씩 등록 : axios.post("통신할주소", { body }, { 옵션 }) → 컨트롤러가 boolean 을 반환
  const submitApply = async () => {
    if (orderedDates.length === 0) { setMessage("희망 날짜를 하나 이상 선택해주세요."); return; }
    const invalid = orderedDates.find((d) => { const t = dateTimes[d.iso] ?? { start: "09:00", end: "12:00" }; return toServerTime(t.start) >= toServerTime(t.end); });
    if (invalid) { setMessage(`${invalid.label}(${invalid.day}) 종료 시간은 시작 시간보다 늦어야 합니다.`); return; }
    try {
      const results = await Promise.all(orderedDates.map((d) => {
        const t = dateTimes[d.iso] ?? { start: "09:00", end: "12:00" };
        return axios.post(
          "http://localhost:8080/request",
          { preferredGender, requestState: "신청", visitDate: d.iso, visitStartTime: toServerTime(t.start), visitEndTime: toServerTime(t.end), requestContent: content.trim() || "방문요양 서비스 신청" },
          { params: { carerecipient_no: recipient.id }, withCredentials: true }
        );
      }));
      if (results.every((res) => res.data)) { setSentCount(results.length); setMessage(""); setApplySent(true); }
      else setMessage("신청에 실패했습니다. 입력 정보를 확인해주세요.");
    } catch (error) {
      console.error(error);
      setMessage("서버 통신 오류가 발생했습니다.");
    }
  };
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

  if (!recipient) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">요양 서비스 신청</h1>
        </div>
        <Panel className="p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-50 text-2xl text-teal-600">＋</div>
          <h2 className="mt-4 font-display text-xl font-bold text-slate-900">먼저 돌봄 어르신을 등록해주세요</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">등록된 수급자 정보를 바탕으로 서비스 신청을 진행합니다.</p>
          <button onClick={onRegisterRecipient} className="mt-5 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">수급자 등록하기</button>
        </Panel>
      </div>
    );
  }

  if (applySent) {
    return (
      <div className="space-y-5">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">서비스 신청</h1>
        </div>
        <Panel className="p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
          <h2 className="mt-5 font-display text-2xl font-extrabold text-slate-900">신청이 접수되었습니다</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">담당 사회복지사가 접수 내용을 검토한 뒤 1~2일 내 유선으로 상담을 진행합니다.</p>
          <div className="mx-auto mt-6 max-w-sm rounded-lg bg-slate-50 p-4 text-left text-sm">
            {[["접수 건수", `${sentCount}건`], ["신청 대상", `${recipient.name} 어르신`], ["희망 날짜", orderedDates.map((d) => `${d.label}(${d.day})`).join(", ") || "미선택"], ["선호 성별", preferredGender === "무관" ? "상관없음" : preferredGender === "여자" ? "여성" : "남성"]].map(([l, v]) => (
              <div key={l} className="flex justify-between border-b border-slate-100 py-2 last:border-0"><span className="text-slate-400">{l}</span><b className="text-slate-700">{v}</b></div>
            ))}
            <div className="flex items-center justify-between py-2"><span className="text-slate-400">진행 상태</span><Badge tone="info">접수 완료 · 검토 대기</Badge></div>
          </div>
          <button onClick={() => { setApplySent(false); onDone(); }} className="mt-6 rounded-lg border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">홈으로 돌아가기</button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">요양 서비스 신청</h1>
        <p className="mt-1 text-sm text-slate-500">등록된 어르신 정보를 바탕으로 희망 방문 일정과 요청 사항을 신청합니다.</p>
      </div>

      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">신청 대상 어르신</p>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="font-display font-bold text-slate-900">{recipient.name} 어르신</h2>
              <select aria-label="신청 대상 어르신 선택" value={recipient.id} onChange={(event) => onSelectRecipient(Number(event.target.value))} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                {recipients.map((item) => <option key={item.id} value={item.id}>{item.name} 어르신</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500">{recipient.address} · {recipient.age}세 · {recipient.gender === "female" ? "여성" : recipient.gender === "male" ? "남성" : "성별 미확인"}</p>
        </div>
        <div className="pt-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-900">희망 방문 일정</h2>
            {orderedDates.length > 0 && <Badge tone="info">{orderedDates.length}일 선택</Badge>}
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600">희망 날짜<span className="ml-1 font-normal text-slate-400">(오늘부터 7일 이내, 원하는 날짜를 모두 선택)</span></p>
              <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {dates.map((d) => {
                  const on = selectedDates.includes(d.iso);
                  return (
                    <button key={d.iso} type="button" onClick={() => toggleDate(d.iso)}
                      className={`rounded-xl border px-1 py-2.5 text-center transition ${on ? "border-teal-500 bg-teal-500 text-white" : "border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-600"}`}>
                      <span className="block text-[10px] font-semibold opacity-80">{d.today ? "오늘" : d.day}</span>
                      <span className="block text-sm font-bold">{d.label}</span>
                      {d.today && <span className="block text-[10px] opacity-80">({d.day})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">날짜별 희망 시간</p>
              {orderedDates.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">희망 날짜를 선택하면 날짜별 시작·종료 시간을 입력할 수 있습니다.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {orderedDates.map((d) => {
                    const t = dateTimes[d.iso] ?? { start: "09:00", end: "12:00" };
                    return (
                      <div key={d.iso} className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2">
                        <span className="grid h-9 w-14 shrink-0 place-items-center rounded-lg bg-teal-50 text-[11px] font-bold leading-tight text-teal-700">{d.label}<br />({d.day})</span>
                        <HourSelect value={t.start} onChange={(e) => setDateTime(d.iso, "start", e.target.value)}
                          className="min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                        <span className="shrink-0 text-xs font-semibold text-slate-400">~</span>
                        <HourSelect value={t.end} onChange={(e) => setDateTime(d.iso, "end", e.target.value)}
                          className="min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <h2 className="font-display font-bold text-slate-900">선호하는 요양보호사 성별</h2>
        <p className="mt-1 text-xs text-slate-400">선택한 성별에 맞는 요양보호사를 우선 배정합니다.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
          {["무관", "여자", "남자"].map((g) => (
            <button key={g} type="button" onClick={() => setPreferredGender(g)} className={`rounded-lg px-2 py-2.5 text-sm font-bold transition ${preferredGender === g ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:bg-white/50"}`}>{g === "무관" ? "상관없음" : g === "여자" ? "여성" : "남성"}</button>
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <h2 className="font-display font-bold text-slate-900">요청 사항</h2>
        <textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} className={`${field} mt-3`} placeholder="어르신 건강 상태, 특이사항, 선호하는 돌봄 방식 등을 자유롭게 적어주세요." />
      </Panel>

      {message && <p className="text-xs font-semibold text-rose-600">{message}</p>}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" className="h-4 w-4 accent-teal-600" /> 개인정보 수집·이용 및 장기요양 서비스 상담을 위한 정보 제공에 동의합니다.
        </label>
        <button onClick={submitApply} className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700">신청서 제출하기 →</button>
      </div>
    </div>
  );
}
