import { useEffect, useRef, useState } from "react";
import availabilityTime, { formatUiTime, isUiTimeRange } from "./availabilityTime";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const hourHeight = 64;
const dayHeight = hourHeight * 24;
const stepMinutes = 60; // 한 칸은 1시간입니다.
const dateText = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const selectionRange = (drag) => ({ availableDate: drag.date, startMinutes: Math.min(drag.anchor, drag.end), endMinutes: drag.anchor === drag.end ? drag.anchor + stepMinutes : Math.max(drag.anchor, drag.end) });

// 겹치는 가용시간/확정 근무도 서로 가리지 않도록 날짜 안에서 나란히 배치합니다.
function arrangeBlocks(blocks) {
  const lanes = [];
  const sorted = [...blocks].sort((a, b) => a.start - b.start || a.end - b.end);
  const arranged = sorted.map((block) => {
    let lane = lanes.findIndex((end) => end <= block.start);
    if (lane === -1) lane = lanes.length;
    lanes[lane] = block.end;
    return { ...block, lane };
  });
  return arranged.map((block) => ({ ...block, lanes: lanes.length }));
}

// confirmedWork는 향후 조회 결과를 변환한 {scheduleNo, visitDate, startMinutes, endMinutes, status} 배열입니다.
export default function AvailabilityWeekView({ items, onEdit, onDelete, onSelect, selection, disabled = false, confirmedWork = [], timeAdapter = availabilityTime }) {
  const today = dateText(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const columnRef = useRef(null);
  const pointerY = useRef(0);
  const scrollRef = useRef(null);
  const [year, month, day] = selectedDate.split("-").map(Number);
  const monday = new Date(year, month - 1, day);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const days = weekdays.map((label, index) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + index);
    return { label, date: dateText(date) };
  });
  const weekItems = items.filter((item) => item.availableDate >= days[0].date && item.availableDate <= days[6].date);
  const mapped = weekItems.map((item) => ({ item, start: timeAdapter.backendValueToUiTime(item.startTime), end: timeAdapter.backendValueToUiTime(item.endTime), type: "availability", date: item.availableDate, key: `availability-${item.availabilityNo}` }));
  const timed = mapped.filter((block) => isUiTimeRange(block.start, block.end));
  const unplaced = mapped.filter((block) => !isUiTimeRange(block.start, block.end));
  const workBlocks = confirmedWork.filter((item) => isUiTimeRange(item.startMinutes, item.endMinutes)).map((item) => ({ item, start: item.startMinutes, end: item.endMinutes, type: "work", date: item.visitDate, key: `work-${item.scheduleNo}` }));
  const preview = drag ? selectionRange(drag) : selection;

  const clearDrag = () => { dragRef.current = null; columnRef.current = null; setDrag(null); };
  const minuteAt = (clientY, column, round = Math.round) => Math.max(0, Math.min(1440, round((clientY - column.getBoundingClientRect().top) / dayHeight * 1440 / stepMinutes) * stepMinutes));
  const updateDrag = (clientY) => {
    if (!dragRef.current || !columnRef.current) return;
    pointerY.current = clientY;
    const end = minuteAt(clientY, columnRef.current);
    if (end !== dragRef.current.end) {
      dragRef.current = { ...dragRef.current, end };
      setDrag(dragRef.current);
    }
  };
  const startDrag = (event, date) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || !onSelect || selection || disabled) return;
    if (event.target.closest("[data-time-block]")) return;
    event.preventDefault();
    const anchor = Math.min(1440 - stepMinutes, minuteAt(event.clientY, event.currentTarget, Math.floor));
    columnRef.current = event.currentTarget;
    pointerY.current = event.clientY;
    dragRef.current = { date, anchor, end: anchor, pointerId: event.pointerId };
    setDrag(dragRef.current);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const finishDrag = (event) => {
    if (!dragRef.current || event.pointerId !== dragRef.current.pointerId) return;
    updateDrag(event.clientY);
    const selected = selectionRange(dragRef.current);
    clearDrag();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onSelect(selected); // 부모 화면에서 자동 저장하고 서버 목록을 다시 조회합니다.
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = hourHeight * 7; }, []);
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") clearDrag(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", clearDrag);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("blur", clearDrag); };
  }, []);
  // 가장자리에서 계속 드래그하면 세로로 스크롤하며 같은 날짜 선택을 유지합니다.
  useEffect(() => {
    if (!drag) return;
    let frame;
    const scroll = () => {
      const container = scrollRef.current;
      if (!dragRef.current || !container) return;
      const rect = container.getBoundingClientRect();
      const delta = pointerY.current < rect.top + 90 ? -8 : pointerY.current > rect.bottom - 35 ? 8 : 0;
      if (delta) { container.scrollTop += delta; updateDrag(pointerY.current); }
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [Boolean(drag)]);

  const moveWeek = (offset) => {
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offset * 7);
    setSelectedDate(dateText(date));
  };
  const rawCard = ({ item, start, end }, showTime = false) => <article key={item.availabilityNo} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"><button type="button" onClick={() => onEdit(item)} className="min-w-0 text-left text-sm"><p className="font-bold text-slate-800">{item.availableDate}</p><p className="mt-1 break-all text-xs text-slate-500">{showTime ? `${formatUiTime(start)} ~ ${formatUiTime(end)}` : `시작 ${item.startTime} · 종료 ${item.endTime} (정수값)`} · {item.status}</p><span className="mt-1 block text-xs font-semibold text-teal-700">수정</span></button><button type="button" onClick={() => onDelete(item)} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600">삭제</button></article>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
        <div><p className="text-sm font-bold text-slate-800">{days[0].date} ~ {days[6].date}</p><p className="mt-1 text-xs text-slate-500">이번 주 가용시간 {weekItems.length}건</p></div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-slate-600">기준 날짜<input type="date" value={selectedDate} onChange={(event) => { if (event.target.value) setSelectedDate(event.target.value); }} className="mt-1 block rounded-lg border border-slate-200 px-2 py-2 text-sm" /></label>
          <button type="button" aria-label="이전 주" onClick={() => moveWeek(-1)} className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">‹</button>
          <button type="button" onClick={() => setSelectedDate(today)} className="rounded-lg border border-teal-200 px-3 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50">오늘</button>
          <button type="button" aria-label="다음 주" onClick={() => moveWeek(1)} className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">›</button>
        </div>
      </div>
      <div id="availability-time-guide" className="space-y-1 border-y border-teal-100 bg-teal-50 px-5 py-3 text-xs leading-5 text-teal-800"><p>한 칸은 1시간입니다. 같은 날짜 안에서 드래그하고 놓으면 팝업 없이 가용시간이 등록됩니다. 저장된 구간은 색칠된 블록으로 남습니다. 드래그 중 Esc로 취소할 수 있습니다.</p><p>모바일·키보드에서는 상단의 가용시간 등록 버튼을 이용하세요.</p></div>
      <div className="flex flex-wrap gap-4 px-5 py-3 text-xs"><span className="text-teal-700">■ 가용시간 · 수정 가능</span><span className="text-slate-600">■ 확정 근무 · 읽기 전용</span><span className="text-teal-600">▧ 선택 · 저장 진행 중</span></div>
      {weekItems.length === 0 && <p role="status" className="px-5 pb-3 text-sm text-slate-500">이번 주에 등록된 가용시간이 없습니다. 시간표에서 새 범위를 선택할 수 있습니다.</p>}
      <div ref={scrollRef} role="region" aria-label="주간 가용시간표" aria-describedby="availability-time-guide" tabIndex={0} className="max-h-[600px] overflow-auto overscroll-contain focus:outline-teal-500">
        <div className="min-w-[900px]">
          <div className="sticky top-0 z-20 grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-white">
            <div className="p-3 text-xs text-slate-500">시간</div>
            {days.map(({ label, date }, index) => <div key={date} className={`border-l border-slate-100 p-3 text-center ${date === today ? "bg-teal-50 text-teal-700" : index === 6 ? "text-rose-600" : "text-slate-700"}`}><p className="text-xs font-semibold">{label}</p><p className="mt-1 text-sm font-bold">{date.slice(5).replace("-", "/")}{date === today && <span className="ml-1 text-[10px]">오늘</span>}</p></div>)}
          </div>
          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] select-none">
            <div className="relative bg-slate-50" style={{ height: dayHeight }}>{Array.from({ length: 25 }, (_, hour) => <span key={hour} className="absolute left-2 font-mono text-[10px] text-slate-400" style={{ top: hour === 24 ? dayHeight - 14 : hour * hourHeight }}>{formatUiTime(hour * 60)}</span>)}</div>
            {days.map(({ date }) => <div key={date} data-day={date} aria-label={`${date} 가용시간 선택`} className="relative border-l border-slate-200 cursor-crosshair" style={{ height: dayHeight }} onPointerDown={(event) => startDrag(event, date)} onPointerMove={(event) => { if (event.pointerId === dragRef.current?.pointerId) updateDrag(event.clientY); }} onPointerUp={finishDrag} onPointerCancel={clearDrag} onLostPointerCapture={clearDrag}>
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <div key={index} className="border-t border-slate-200" style={{ height: hourHeight }} />)}</div>
              {arrangeBlocks([...timed, ...workBlocks].filter((block) => block.date === date)).map((block) => {
                const isWork = block.type === "work";
                const label = `${isWork ? "확정 근무" : "가용시간"} ${formatUiTime(block.start)} ~ ${formatUiTime(block.end)} · ${block.item.status || "상태 미등록"}`;
                return <div key={block.key} data-time-block={block.type} onClick={(event) => { if (!isWork && !event.target.closest("button")) onEdit(block.item); }} className={`absolute z-[1] overflow-auto rounded-md border ${isWork ? "cursor-default border-slate-300 bg-slate-100 text-slate-700" : "cursor-pointer border-teal-300 bg-teal-100 text-teal-900"}`} style={{ top: block.start / 1440 * dayHeight, height: (block.end - block.start) / 1440 * dayHeight, left: `calc(${block.lane / block.lanes * 100}% + 2px)`, width: `calc(${100 / block.lanes}% - 4px)` }}>
                  {isWork ? <div title={label} className="cursor-default p-1.5 text-[11px]"><b>확정 근무</b><p>{formatUiTime(block.start)} ~ {formatUiTime(block.end)}</p><p>{block.item.status}</p><p>읽기 전용</p></div> : <><button type="button" title={label} aria-label={`${date} ${label} 수정`} onClick={() => onEdit(block.item)} className="w-full p-1.5 text-left text-[11px] hover:bg-teal-200"><b>가용시간</b><p>{formatUiTime(block.start)} ~ {formatUiTime(block.end)}</p><p className="break-words">{block.item.status}</p></button><button type="button" onClick={() => onDelete(block.item)} className="w-full border-t border-teal-200 py-1 text-[11px] text-rose-600 hover:bg-rose-50">삭제</button></>}
                </div>;
              })}
              {preview?.availableDate === date && <div data-selection-block className="pointer-events-none absolute inset-x-0.5 z-10 rounded-md border-2 border-dashed border-teal-600 bg-teal-400/30 px-1 py-0.5 text-[11px] font-bold text-teal-950" style={{ top: preview.startMinutes / 1440 * dayHeight, height: (preview.endMinutes - preview.startMinutes) / 1440 * dayHeight }}>{formatUiTime(preview.startMinutes)} ~ {formatUiTime(preview.endMinutes)}<span className="block text-[10px]">{drag ? "선택 중" : preview.label || "저장 중..."}</span></div>}
            </div>)}
          </div>
        </div>
      </div>
      {drag && <p role="status" className="px-5 py-2 text-xs text-teal-700">{preview.availableDate} · {formatUiTime(preview.startMinutes)} ~ {formatUiTime(preview.endMinutes)} 선택 중</p>}
      {unplaced.length > 0 && <section className="space-y-3 border-t border-slate-200 p-5"><h3 className="text-sm font-bold text-slate-800">시간 배치를 확인할 가용시간 · {unplaced.length}건</h3><p className="text-xs leading-5 text-slate-500">0~24시 범위를 벗어나거나 시작·종료 순서가 맞지 않는 데이터입니다. 저장값을 자동 변경하지 않으며, 수정 또는 삭제할 수 있습니다.</p><div className="grid gap-2 sm:grid-cols-2">{unplaced.map((block) => rawCard(block))}</div></section>}
      {timed.length > 0 && <section className="space-y-3 border-t border-slate-200 p-5 lg:hidden"><h3 className="text-sm font-bold text-slate-800">이번 주 가용시간 목록</h3>{timed.map((block) => rawCard(block, true))}</section>}
    </div>
  );
}
