import { useEffect, useState } from "react";
import axios from "axios";
import Badge from "../../../components/common/Badge";
import { WEEK_LIMIT } from "../../../constants";
import { buildCenters } from "../../../utils/adminAdapters";
import { toHhmm } from "../../../utils/timeFormat";

const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");
// "2026-10-14" → "10.14 (수)"
const dateLabel = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad(m)}.${pad(d)} (${DAY_KR[new Date(y, m - 1, d).getDay()]})`;
};
const todayIso = (() => { const now = new Date(); return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`; })();
// 근무기록 상태 배지 : 배정 = 요양보호사 수락 대기
const recordTone = { 배정: "warning", 확정: "ok", 완료: "neutral", 취소: "danger" };
const recordLabel = { 배정: "수락 대기", 확정: "확정", 완료: "완료", 취소: "취소" };

// 요양보호사 상세 조회 모달 (보호자 관리 · 요양보호사 관리 · 방문 일정 공용)
// careworkerNo : 조회할 요양보호사 번호, stats : 화면에서 이미 계산한 { week, month } (없으면 근무 현황을 숨김)
// withRecords : true 면 근무 기록도 함께 조회, recipientNameOf : 요청 번호 → 수급자 이름 (근무 기록에 표시)
// GET /api/careworkers/detail?careworkerNo=번호 → { careworkerNo, careworkerName, careworkerGender, careworkerAge, hourWage, careworkerState, signState, careworkerAddress, centerNo, userNo }
// GET /careworkerreport/careworker?careworkerNo=번호 → [{ careworkersReportNo, requestNo, workDate, workStartTime, workEndTime, workStatus }]
export default function CaregiverDetailModal({ careworkerNo, stats, withRecords = false, recipientNameOf, onClose }) {
  const [detail, setDetail] = useState(null);
  const [centers, setCenters] = useState(buildCenters([]));
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function loadDetail() {
      setStatus("loading");
      try {
        const [detailRes, centersRes, recordsRes] = await Promise.all([
          axios.get("http://localhost:8080/api/careworkers/detail", { params: { careworkerNo }, withCredentials: true }),
          axios.get("/center", { withCredentials: true }).catch(() => ({ data: [] })),
          withRecords
            ? axios.get("http://localhost:8080/careworkerreport/careworker", { params: { careworkerNo }, withCredentials: true })
            : Promise.resolve({ data: [] }),
        ]);
        if (!detailRes.data) { setStatus("empty"); return; }
        setDetail(detailRes.data);
        setCenters(buildCenters(centersRes.data));
        setRecords(Array.isArray(recordsRes.data) ? recordsRes.data : []);
        setStatus("ok");
      } catch (error) {
        console.error("요양보호사 상세 조회 실패:", error);
        setStatus("error");
      }
    }
    loadDetail();
  }, [careworkerNo, withRecords]);

  // 근무 기록 : 오늘 이후 일정(가까운 날짜 순) → 지난 기록(최근 순)
  const byDateTime = (a, b) => `${a.workDate}${pad(a.workStartTime ?? 0)}`.localeCompare(`${b.workDate}${pad(b.workStartTime ?? 0)}`);
  const upcomingRecords = records.filter((r) => r.workDate >= todayIso).sort(byDateTime);
  const pastRecords = records.filter((r) => r.workDate < todayIso).sort((a, b) => byDateTime(b, a));
  const countOf = (st) => records.filter((r) => r.workStatus === st).length;

  const center = detail ? centers.find((c) => c.id === detail.centerNo) : null;
  const stateTone = detail?.careworkerState === "근무중" ? "ok" : detail?.careworkerState === "휴직" ? "warning" : "neutral";
  const pct = stats ? Math.min(100, (stats.week / WEEK_LIMIT) * 100) : 0;
  const bar = stats && stats.week >= WEEK_LIMIT ? "bg-red-500" : stats && stats.week >= 48 ? "bg-amber-500" : "bg-teal-500";
  const rows = detail ? [
    ["나이", detail.careworkerAge != null ? `${detail.careworkerAge}세` : "-"],
    ["성별", detail.careworkerGender ?? "-"],
    ["시급", detail.hourWage ? `${detail.hourWage.toLocaleString()}원` : "미정"],
    ["주소", (detail.careworkerAddress ?? "-").replace(/^(서울특별시|경기도)\s*/, "")],
    ["소속 센터", center?.name ?? "-"],
    ["가입 상태", detail.signState ?? "-"],
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${withRecords ? "max-w-lg" : "max-w-md"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900">요양보호사 상세</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>
        {status === "loading" && <p className="px-6 py-10 text-center text-sm text-slate-400">요양보호사 정보를 불러오는 중입니다...</p>}
        {status === "empty" && <p className="px-6 py-10 text-center text-sm text-slate-400">요양보호사 정보를 찾을 수 없습니다.</p>}
        {status === "error" && <p className="px-6 py-10 text-center text-sm text-red-500">요양보호사 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>}
        {status === "ok" && (
          <div className="p-6">
            {/* 요양보호사 관리 카드와 같은 머리글 : 이름 첫 글자 · 이름 · 성별 · 센터 · 근무 상태 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-teal-100 font-display text-lg font-bold text-teal-700">{detail.careworkerName?.[0]}</div>
                <div>
                  <b className="text-lg text-slate-900">{detail.careworkerName}</b>
                  <p className="mt-0.5 text-xs text-slate-400">{(detail.careworkerGender ?? "-")[0]}{center && ` · ${center.short}`}</p>
                </div>
              </div>
              <Badge tone={stateTone}>{detail.careworkerState ?? "-"}</Badge>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
                  <span className="shrink-0 text-slate-400">{label}</span><b className="text-right text-slate-700">{value}</b>
                </div>
              ))}
            </div>

            {stats && <>
              <div className="mt-5">
                <div className="flex items-end justify-between"><span className="text-[11px] text-slate-400">이번 주 근무시간</span><b className={`font-mono text-sm ${stats.week >= WEEK_LIMIT ? "text-red-600" : stats.week >= 48 ? "text-amber-600" : "text-slate-800"}`}>{stats.week} / {WEEK_LIMIT}시간</b></div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="mt-4 text-center">
                <b className="font-mono text-lg text-slate-800">{stats.month}</b><p className="text-[11px] text-slate-400">이번 달 배정 건수</p>
              </div>
            </>}

            {withRecords && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">근무 기록 {records.length}건</h3>
                  <div className="flex gap-1">
                    {["배정", "확정", "완료", "취소"].map((st) => <Badge key={st} tone={recordTone[st]}>{recordLabel[st]} {countOf(st)}</Badge>)}
                  </div>
                </div>
                <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
                  {[["예정 일정", upcomingRecords], ["지난 기록", pastRecords]].map(([title, list]) => list.length > 0 && (
                    <div key={title}>
                      <p className="mb-1.5 text-[11px] font-bold text-teal-600">{title} · {list.length}건</p>
                      <div className="space-y-1">
                        {list.map((r) => (
                          <div key={r.careworkersReportNo} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                            <span className="w-20 shrink-0 font-mono text-slate-500">{dateLabel(r.workDate)}</span>
                            <span className="w-20 shrink-0 font-mono text-slate-600">{toHhmm(r.workStartTime)}~{toHhmm(r.workEndTime)}</span>
                            <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">{recipientNameOf?.(r.requestNo) ?? "-"}</span>
                            <Badge tone={recordTone[r.workStatus] ?? "neutral"}>{recordLabel[r.workStatus] ?? r.workStatus}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {records.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">근무 기록이 없습니다.</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
