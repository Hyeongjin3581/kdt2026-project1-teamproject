import { useEffect, useState } from "react";
import HourSelect from "../../../components/common/HourSelect";
import { toHhmm, toServerTime } from "../../../utils/timeFormat";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import LoadStatus from "../../../components/common/LoadStatus";
import { TODAY } from "../../../constants";
import { buildHistory, buildVisits } from "../../../utils/guardianAdapters";
import { upcomingDates } from "../../../utils/upcomingDates";

export default function GuardianRequest({ guardian, recipients, activeRecipientId, onSelectRecipient }) {
  const [reqSent, setReqSent] = useState(false);
  const [categories, setCategories] = useState([]);
  const [requestType, setRequestType] = useState("");
  const [requestContent, setRequestContent] = useState("");
  const [history, setHistory] = useState([]);
  const [visits, setVisits] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null); // 병합 중 빠진 선언 복구 (2026. 10. 06)
  const dates = upcomingDates(7); // 오늘부터 7일
  const [selectedDates, setSelectedDates] = useState([]); // 선택한 날짜 (yyyy-MM-dd)
  const [preferredTimes, setPreferredTimes] = useState({}); // 날짜별 { start, end }
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const orderedDates = dates.filter((d) => selectedDates.includes(d.iso));
  const toggleDate = (iso) => {
    setSelectedDates((current) => current.includes(iso) ? current.filter((item) => item !== iso) : [...current, iso]);
    setPreferredTimes((current) => current[iso]
      ? current
      : { ...current, [iso]: { start: "09:00", end: "12:00" } });
  };
  const updateTime = (iso, key, value) => {
    setPreferredTimes((current) => ({ ...current, [iso]: { ...current[iso], [key]: value } }));
  };
  const needsSchedule = requestType !== "담당자 관련 문의" && requestType !== "기타 문의";
  const selectedRecipient = recipients.find((recipient) => recipient.id === activeRecipientId) ?? recipients[0];
  const selectedRequest = history.find((request) => request.id === selectedRequestId);
  const selectedVisit = visits.find((visit) => visit.id === selectedVisitId);

  // 문의 카테고리 + 보호자 문의 + 수급자의 방문 요청/근무기록/요양보호사를 axios로 조회
  async function loadData() {
    setStatus("loading");
    try {
      const [categoriesRes, inquiriesRes, careworkersRes] = await Promise.all([
        axios.get("http://localhost:8080/inquirycategory", { withCredentials: true }),
        axios.get("http://localhost:8080/guardianinquiry", { withCredentials: true }),
        axios.get("/api/careworkers", { withCredentials: true }),
      ]);
      const requestsRes = selectedRecipient
        ? await axios.get("/request/carerecipient", { params: { careRecipientNo: selectedRecipient.id }, withCredentials: true })
        : { data: [] };
      const reportLists = await Promise.all([...new Set(careworkersRes.data.map((c) => c.centerNo))].map((no) =>
        axios.get("/careworkerreport/center", { params: { centerNo: no }, withCredentials: true }).catch(() => ({ data: [] }))
      ));
      setCategories(categoriesRes.data);
      setRequestType((current) => current || categoriesRes.data[0]?.inquiryCategoryName || "");
      setVisits(buildVisits({ requests: requestsRes.data, reports: reportLists.flatMap((res) => res.data), careworkers: careworkersRes.data }).filter((v) => !v.cancelled));
      setHistory(buildHistory({
        inquiries: inquiriesRes.data.filter((i) => i.guardianNo === guardian?.guardianNo),
        categories: categoriesRes.data,
        requests: requestsRes.data,
      }));
      setStatus("ok");
    } catch (error) {
      console.error("요청·문의 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, [selectedRecipient?.id, guardian?.guardianNo]);

  // 선택한 내역(문의/서비스 신청) 수정·삭제 : 문의는 진행 상태가 없어 항상, 서비스 신청은 "신청" 상태일 때만 가능
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ categoryNo: "", date: "", start: "", end: "", content: "" });
  const canManage = selectedRequest && (selectedRequest.source === "inquiry" || selectedRequest.raw.requestState === "신청");
  const updateEdit = (key, value) => setEditForm((current) => ({ ...current, [key]: value }));

  const startEdit = () => {
    const raw = selectedRequest.raw;
    setEditForm(selectedRequest.source === "inquiry"
      ? { categoryNo: raw.inquiryCategoryNo, date: raw.wishDate ?? "", start: toHhmm(raw.wishStartTime), end: toHhmm(raw.wishEndTime), content: raw.inquiryContent ?? "" }
      : { categoryNo: "", date: raw.visitDate ?? "", start: toHhmm(raw.visitStartTime), end: toHhmm(raw.visitEndTime), content: raw.requestContent ?? "" });
    setEditing(true);
  };

  // 문의 수정 : PUT /guardianinquiry (body), 서비스 신청 수정 : PUT /request?request_no=번호 (body)
  const saveEdit = async () => {
    const raw = selectedRequest.raw;
    try {
      const response = selectedRequest.source === "inquiry"
        ? await axios.put("http://localhost:8080/guardianinquiry", {
            inquiryNo: raw.inquiryNo, guardianNo: raw.guardianNo, inquiryCategoryNo: Number(editForm.categoryNo),
            wishDate: editForm.date || null, wishStartTime: toServerTime(editForm.start), wishEndTime: toServerTime(editForm.end), inquiryContent: editForm.content,
          }, { withCredentials: true })
        : await axios.put("http://localhost:8080/request", {
            visitDate: editForm.date || null, visitStartTime: toServerTime(editForm.start), visitEndTime: toServerTime(editForm.end), requestContent: editForm.content,
          }, { params: { requestNo: raw.requestNo }, withCredentials: true });
      if (response.data) { setEditing(false); setSelectedRequestId(null); loadData(); }
      else alert("수정에 실패했습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  // 문의 삭제 : DELETE /guardianinquiry (body 에 { inquiryNo }), 서비스 신청 취소 : DELETE /request?request_no=번호
  const removeItem = async () => {
    const raw = selectedRequest.raw;
    if (!window.confirm(selectedRequest.source === "inquiry" ? "이 문의를 삭제할까요?" : "이 서비스 신청을 취소할까요?")) return;
    try {
      const response = selectedRequest.source === "inquiry"
        ? await axios.delete("http://localhost:8080/guardianinquiry", { params: { inquiryNo: raw.inquiryNo }, withCredentials: true })
        : await axios.delete("/request", { params: { requestNo: raw.requestNo }, withCredentials: true });
      if (response.data) { setEditing(false); setSelectedRequestId(null); loadData(); }
      else alert("처리에 실패했습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  const selectRecipient = (id) => {
    onSelectRecipient(id);
    setSelectedRequestId(null);
    setSelectedVisitId(null);
  };

  // 요청 보내기 : 선택한 날짜마다 문의 1건씩 등록 (POST /guardianinquiry), 날짜가 필요 없는 유형은 1건
  const sendRequest = async () => {
    if (!selectedRecipient || !selectedVisit || !guardian) return;
    const category = categories.find((c) => c.inquiryCategoryName === requestType);
    if (!category) return;
    const content = `[${selectedRecipient.name} 어르신 · ${selectedVisit.date} ${selectedVisit.time}] ${requestContent.trim()}`.trim();
    const invalid = needsSchedule && orderedDates.find((d) => toServerTime(preferredTimes[d.iso]?.start ?? "09:00") >= toServerTime(preferredTimes[d.iso]?.end ?? "12:00"));
    if (invalid) { alert(`${invalid.label}(${invalid.day}) 종료 시간은 시작 시간보다 늦어야 합니다.`); return; }
    const bodies = needsSchedule && orderedDates.length > 0
      ? orderedDates.map((d) => ({
          guardianNo: guardian.guardianNo,
          inquiryCategoryNo: category.inquiryCategoryNo,
          wishDate: d.iso,
          wishStartTime: toServerTime(preferredTimes[d.iso]?.start ?? "09:00"),
          wishEndTime: toServerTime(preferredTimes[d.iso]?.end ?? "12:00"),
          inquiryContent: content,
        }))
      : [{ guardianNo: guardian.guardianNo, inquiryCategoryNo: category.inquiryCategoryNo, inquiryContent: content }];
    try {
      const results = await Promise.all(bodies.map((body) => axios.post("http://localhost:8080/guardianinquiry", body, { withCredentials: true })));
      if (results.every((res) => res.data)) {
        setRequestContent("");
        setReqSent(true);
        loadData();
      } else {
        alert("요청 전달에 실패했습니다. 입력 정보를 확인해주세요.");
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };
  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;

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
            {editing && <div className="mt-3 grid gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
              {selectedRequest.source === "inquiry" && <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">문의 유형
                <select value={editForm.categoryNo} onChange={(e) => updateEdit("categoryNo", e.target.value)} className={field}>{categories.map((c) => <option key={c.inquiryCategoryNo} value={c.inquiryCategoryNo}>{c.inquiryCategoryName}</option>)}</select>
              </label>}
              <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">{selectedRequest.source === "inquiry" ? "희망 날짜" : "방문 날짜"}<input type="date" value={editForm.date} onChange={(e) => updateEdit("date", e.target.value)} className={field} /></label>
              <label className="block text-xs font-semibold text-slate-600">시작 시간<HourSelect value={editForm.start} onChange={(e) => updateEdit("start", e.target.value)} className={field} /></label>
              <label className="block text-xs font-semibold text-slate-600">종료 시간<HourSelect value={editForm.end} onChange={(e) => updateEdit("end", e.target.value)} className={field} /></label>
              <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">내용<textarea rows={3} value={editForm.content} onChange={(e) => updateEdit("content", e.target.value)} className={`${field} resize-none`} /></label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-white">취소</button>
                <button type="button" onClick={saveEdit} className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-700">수정 저장</button>
              </div>
            </div>}
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              {canManage && !editing && <>
                <button type="button" onClick={startEdit} className="rounded-lg border border-teal-200 px-4 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-50">수정</button>
                <button type="button" onClick={removeItem} className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50">{selectedRequest.source === "inquiry" ? "삭제" : "신청 취소"}</button>
              </>}
              <button type="button" onClick={() => { setEditing(false); setSelectedRequestId(null); }} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">새 요청 작성</button>
            </div>
          </> : <>
          <h2 className="font-display font-bold text-slate-900">요청 보내기</h2>
          <p className="mt-1 text-xs text-slate-400">{selectedRecipient ? `${selectedRecipient.name} 어르신` : "수급자"}의 방문 일정에 대한 요청을 센터에 전달합니다.</p>
          {selectedVisit && <div className="mt-4 flex items-center justify-between rounded-lg border border-teal-100 bg-teal-50 px-3 py-2.5"><div><p className="text-[10px] font-bold tracking-wide text-teal-600">선택한 방문 일정</p><p className="mt-0.5 text-xs font-bold text-teal-800">{selectedVisit.date} · {selectedVisit.time}</p></div><button type="button" onClick={() => setSelectedVisitId(null)} className="text-xs font-semibold text-teal-700 hover:underline">변경</button></div>}
          {!selectedVisit ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-teal-50 text-lg text-teal-600">▤</div>
              <p className="mt-3 text-sm font-bold text-slate-700">방문 일정을 선택해주세요</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">오른쪽 방문 일정에서 변경하거나 문의할 일정을 선택하면 요청 작성이 활성화됩니다.</p>
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
                <select value={requestType} onChange={(event) => setRequestType(event.target.value)} className={field}>{categories.map((c) => <option key={c.inquiryCategoryNo}>{c.inquiryCategoryName}</option>)}</select>
              </label>
              {needsSchedule && <section className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-800">희망 방문 일정</h3>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-700">희망 날짜 <span className="font-normal text-slate-400">(오늘부터 7일 이내, 원하는 날짜를 모두 선택)</span></p>
                  <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {dates.map((d) => {
                      const isSelected = selectedDates.includes(d.iso);
                      return <button key={d.iso} type="button" onClick={() => toggleDate(d.iso)} aria-pressed={isSelected} className={`rounded-xl border px-1 py-2.5 text-center transition ${isSelected ? "border-teal-500 bg-teal-500 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"}`}><span className="block text-[10px] font-semibold opacity-80">{d.today ? "오늘" : d.day}</span><span className="block text-sm font-bold">{d.label}</span>{d.today && <span className="block text-[10px] opacity-80">({d.day})</span>}</button>;
                    })}
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-700">날짜별 희망 시간</p>
                  {orderedDates.length > 0 ? <div className="mt-3 space-y-2">
                    {orderedDates.map((d) => (
                      <div key={d.iso} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
                        <span className="grid h-9 w-14 shrink-0 place-items-center rounded-lg bg-teal-50 text-[11px] font-bold leading-tight text-teal-700">{d.label}<br />({d.day})</span>
                        <HourSelect aria-label={`${d.label} 시작 시간`} value={preferredTimes[d.iso]?.start ?? "09:00"} onChange={(event) => updateTime(d.iso, "start", event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                        <span className="text-xs font-bold text-slate-400">~</span>
                        <HourSelect aria-label={`${d.label} 종료 시간`} value={preferredTimes[d.iso]?.end ?? "12:00"} onChange={(event) => updateTime(d.iso, "end", event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                      </div>
                    ))}
                  </div> : <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3 text-xs text-slate-400">희망 날짜를 선택해주세요.</p>}
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
                return <button key={recipient.id} type="button" onClick={() => selectRecipient(recipient.id)} className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${isSelected ? "border-teal-200 bg-teal-50" : "border-transparent hover:bg-slate-50"}`}>
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}>{recipient.name[0]}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{recipient.name} 어르신</span><span className="block text-[11px] text-slate-400">{isSelected ? `접수 내역 ${history.length}건` : "선택하면 내역을 확인합니다"}</span></span>
                  <span className="text-slate-300">›</span>
                </button>;
              })}
            </div>
          </div>
          <div className="border-b border-slate-100 p-3">
            <p className="px-1 pb-2 font-mono text-[10px] font-bold tracking-[.14em] text-teal-600">VISIT SCHEDULE</p>
            <div className="space-y-1">
              {visits.map((visit) => {
                const isSelected = visit.id === selectedVisit?.id;
                return <button key={visit.id} type="button" onClick={() => { setSelectedVisitId(visit.id); setSelectedRequestId(null); setReqSent(false); }} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${isSelected ? "border-teal-300 bg-teal-50 shadow-sm" : "border-transparent hover:bg-slate-50"}`}><div><p className="text-xs font-semibold text-slate-700">{visit.date} · {visit.time}</p><p className="mt-0.5 text-[10px] text-slate-400">{visit.caregiver}</p></div><Badge tone={visit.tone}>{visit.status}</Badge></button>;
              })}
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
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
