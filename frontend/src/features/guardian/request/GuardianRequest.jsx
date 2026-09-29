import { useState } from "react";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { TODAY } from "../../../constants";

export default function GuardianRequest({ recipients, activeRecipientId, onSelectRecipient }) {
  const [reqSent, setReqSent] = useState(false);
  const [requestType, setRequestType] = useState("방문 시간 변경 요청");
  const [requestContent, setRequestContent] = useState("");
  const [requestHistory, setRequestHistory] = useState({});
  const [selectedDays, setSelectedDays] = useState([]);
  const [preferredTimes, setPreferredTimes] = useState({});
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
  const toggleDay = (day) => {
    setSelectedDays((current) => {
      if (current.includes(day)) return current.filter((item) => item !== day);
      return [...current, day];
    });
    setPreferredTimes((current) => current[day]
      ? current
      : { ...current, [day]: { start: "09:00", end: "12:00" } });
  };
  const updateTime = (day, key, value) => {
    setPreferredTimes((current) => ({ ...current, [day]: { ...current[day], [key]: value } }));
  };
  const needsSchedule = requestType !== "담당자 관련 문의";
  const selectedRecipient = recipients.find((recipient) => recipient.id === activeRecipientId) ?? recipients[0];
  const history = requestHistory[selectedRecipient?.id] ?? [];
  const visits = [];
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const selectedRequest = history.find((request) => request.id === selectedRequestId);
  const selectedVisit = visits.find((visit) => visit.id === selectedVisitId);
  const selectRecipient = (id) => {
    onSelectRecipient(id);
    setSelectedRequestId(null);
    setSelectedVisitId(null);
  };
  const sendRequest = () => {
    if (!selectedRecipient || !selectedVisit) return;
    const date = new Date().toISOString().slice(0, 10);
    const newRequest = {
      id: `ONC-${Date.now()}`,
      date,
      kind: requestType === "담당자 관련 문의" ? "문의" : "요청",
      type: requestType,
      service: selectedVisit.service,
      status: "접수 완료",
      tone: "info",
      summary: `${selectedVisit.date} 방문 일정에 대한 ${requestType}`,
      details: [
        ["연결된 신청", selectedVisit.service],
        ["대상 방문", `${selectedVisit.date} · ${selectedVisit.time} · ${selectedVisit.caregiver}`],
        ["요청 내용", requestContent.trim() || "별도 내용 없이 일정 관련 요청을 전달했습니다."],
        ["접수 일시", new Date().toLocaleString("ko-KR")],
      ],
    };
    setRequestHistory((current) => ({ ...current, [selectedRecipient.id]: [newRequest, ...(current[selectedRecipient.id] ?? [])] }));
    setRequestContent("");
    setReqSent(true);
  };
  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">GUARDIAN PORTAL · {TODAY.replace(/[()]/g, "").trim()}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">요청 · 문의</h1>
        <p className="mt-1 text-sm text-slate-500">방문 시간 변경이나 문의사항을 센터에 전달합니다.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <Panel className="p-5">
          {selectedRequest ? <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="font-mono text-[10px] font-bold tracking-[.14em] text-teal-600">REQUEST DETAIL · {selectedRequest.id}</p>
                <h2 className="mt-1 font-display text-lg font-bold text-slate-900">{selectedRecipient.name} 어르신 · {selectedRequest.type}</h2>
                <p className="mt-1 text-xs text-slate-400">{selectedRequest.date} 접수 · {selectedRequest.kind}</p>
              </div>
              <Badge tone={selectedRequest.tone}>{selectedRequest.status}</Badge>
            </div>
            <dl className="mt-1 divide-y divide-slate-100">
              {selectedRequest.details.map(([label, value]) => <div key={label} className="grid gap-2 py-4 sm:grid-cols-[110px_1fr]"><dt className="text-xs font-bold text-slate-400">{label}</dt><dd className="text-sm leading-6 text-slate-700">{value}</dd></div>)}
            </dl>
            <div className="mt-2 flex justify-end"><button type="button" onClick={() => setSelectedRequestId(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">새 요청 작성</button></div>
          </> : <>
          <h2 className="font-display font-bold text-slate-900">요청 보내기</h2>
          <p className="mt-1 text-xs text-slate-400">{selectedRecipient ? `${selectedRecipient.name} 어르신` : "수급자"}의 방문 일정에 대한 요청을 센터에 전달합니다.</p>
          {selectedVisit && <div className="mt-4 flex items-center justify-between rounded-lg border border-teal-100 bg-teal-50 px-3 py-2.5"><div><p className="text-[10px] font-bold tracking-wide text-teal-600">선택한 방문 일정</p><p className="mt-0.5 text-xs font-bold text-teal-800">{selectedVisit.date} · {selectedVisit.time}</p></div><button type="button" onClick={() => setSelectedVisitId(null)} className="text-xs font-semibold text-teal-700 hover:underline">변경</button></div>}
          {!selectedVisit ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-teal-50 text-lg text-teal-600">▤</div>
              <p className="mt-3 text-sm font-bold text-slate-700">방문 일정을 선택해주세요</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">연결된 방문 일정 데이터가 없습니다. 일정을 불러온 뒤 요청을 작성할 수 있습니다.</p>
            </div>
          ) : reqSent ? (
            <div className="mt-4 rounded-lg bg-teal-50 p-5 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-xl text-teal-600">✓</div>
              <p className="mt-3 text-sm font-semibold text-teal-800">요청이 센터에 전달되었습니다.</p>
              <p className="mt-1 text-xs text-teal-600">담당 사회복지사가 확인 후 연락드립니다.</p>
              <button onClick={() => setReqSent(false)} className="mt-4 rounded-lg border border-teal-200 px-4 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100">새 요청 보내기</button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-600">요청 유형
                <select value={requestType} onChange={(event) => setRequestType(event.target.value)} className={field}><option>방문 시간 변경 요청</option><option>방문 요일 변경 요청</option><option>담당자 관련 문의</option><option>방문 취소</option></select>
              </label>
              {needsSchedule && <section className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-800">희망 방문 일정</h3>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-700">희망 요일 <span className="font-normal text-slate-400">(원하는 요일을 모두 선택)</span></p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {weekdays.map((day) => {
                      const isSelected = selectedDays.includes(day);
                      return <button key={day} type="button" onClick={() => toggleDay(day)} aria-pressed={isSelected} className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-bold transition ${isSelected ? "border-teal-500 bg-teal-500 text-white shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-700"}`}>{day}</button>;
                    })}
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-700">요일별 희망 시간</p>
                  {selectedDays.length > 0 ? <div className="mt-3 space-y-2">
                    {selectedDays.map((day) => (
                      <div key={day} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">{day}</span>
                        <input aria-label={`${day}요일 시작 시간`} type="time" value={preferredTimes[day]?.start ?? "09:00"} onChange={(event) => updateTime(day, "start", event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                        <span className="text-xs font-bold text-slate-400">~</span>
                        <input aria-label={`${day}요일 종료 시간`} type="time" value={preferredTimes[day]?.end ?? "12:00"} onChange={(event) => updateTime(day, "end", event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                      </div>
                    ))}
                  </div> : <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3 text-xs text-slate-400">희망 요일을 선택해주세요.</p>}
                </div>
              </section>}
              <label className="block text-xs font-semibold text-slate-600">내용<textarea value={requestContent} onChange={(event) => setRequestContent(event.target.value)} rows={4} className={`${field} resize-none`} placeholder="예: 다음 주 수요일 방문을 오후로 옮겨주실 수 있을까요?" /></label>
              <div className="flex justify-end"><button onClick={sendRequest} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">요청 보내기</button></div>
            </div>
          )}</>}
        </Panel>
        <Panel className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-display font-bold text-slate-900">요청 내역</h2>
            <p className="mt-1 text-xs text-slate-400">수급자를 선택해 해당 요청·문의·신청 내역을 확인하세요.</p>
            <div className="mt-3 grid gap-2">
              {recipients.map((recipient) => {
                const isSelected = recipient.id === selectedRecipient?.id;
                const count = (requestHistory[recipient.id] ?? []).length;
                return <button key={recipient.id} type="button" onClick={() => selectRecipient(recipient.id)} className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${isSelected ? "border-teal-200 bg-teal-50" : "border-transparent hover:bg-slate-50"}`}>
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}>{recipient.name[0]}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{recipient.name} 어르신</span><span className="block text-[11px] text-slate-400">{recipient.id === 1 ? "서비스 신청 내역" : `접수 내역 ${count}건`}</span></span>
                  <span className="text-slate-300">›</span>
                </button>;
              })}
              {recipients.length === 0 && <p className="rounded-lg px-3 py-4 text-center text-xs text-slate-400">연결된 수급자 데이터가 없습니다.</p>}
            </div>
          </div>
          <div className="border-b border-slate-100 p-3">
            <p className="px-1 pb-2 font-mono text-[10px] font-bold tracking-[.14em] text-teal-600">VISIT SCHEDULE</p>
            <div className="space-y-1">
              {visits.map((visit) => {
                const isSelected = visit.id === selectedVisit?.id;
                return <button key={visit.id} type="button" onClick={() => { setSelectedVisitId(visit.id); setSelectedRequestId(null); setReqSent(false); }} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${isSelected ? "border-teal-300 bg-teal-50 shadow-sm" : "border-transparent hover:bg-slate-50"}`}><div><p className="text-xs font-semibold text-slate-700">{visit.date} · {visit.time}</p><p className="mt-0.5 text-[10px] text-slate-400">{visit.caregiver}</p></div><Badge tone={visit.tone}>{visit.status}</Badge></button>;
              })}
              {visits.length === 0 && <p className="px-3 py-4 text-center text-xs text-slate-400">조회된 방문 일정이 없습니다.</p>}
            </div>
          </div>
          <div className="p-3">
            <p className="px-1 pb-2 font-mono text-[10px] font-bold tracking-[.14em] text-slate-400">REQUEST HISTORY · {history.length}</p>
            <div className="space-y-1">
              {history.map((item) => {
                const isSelected = item.id === selectedRequest?.id;
                return <button key={item.id} type="button" onClick={() => setSelectedRequestId(item.id)} className={`w-full rounded-lg border p-3 text-left transition ${isSelected ? "border-teal-300 bg-teal-50/70 shadow-sm" : "border-transparent hover:bg-slate-50"}`}>
                  <div className="flex items-start justify-between gap-2"><div><span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">{item.kind}</span><span className="text-xs font-bold text-slate-700">{item.type}</span><p className="mt-1 text-[11px] font-medium text-teal-700">신청 · {item.service}</p><p className="mt-0.5 text-[11px] text-slate-400">{item.date} · {item.summary}</p></div><Badge tone={item.tone}>{item.status}</Badge></div>
                </button>;
              })}
              {history.length === 0 && <p className="px-3 py-4 text-center text-xs text-slate-400">요청 내역이 없습니다.</p>}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
