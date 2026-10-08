//
import { TODAY, WEEK_LIMIT, WEEK_START } from "../constants";
import { toHhmm } from "./timeFormat";

// 백엔드 엔티티 DTO(번호로 연결된 정규화 데이터)를 화면이 쓰는 형태로 조합한다.
const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");
const parseDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (iso, n) => { const d = parseDate(iso); d.setDate(d.getDate() + n); return toIso(d); };
const mdLabel = (iso) => { const d = parseDate(iso); return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${DAY_KR[d.getDay()]})`; };
const koDateLabel = (iso) => { const d = parseDate(iso); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_KR[d.getDay()]})`; };
const hhmm = toHhmm;
const range = (a, b) => `${hhmm(a)}~${hhmm(b)}`;
const minutes = (t) => { const [h, m] = toHhmm(t).split(":").map(Number); return h * 60 + m; };
const hoursBetween = (a, b) => (a && b ? (minutes(b) - minutes(a)) / 60 : 0);
const fmtHours = (h) => `${Math.round(h * 10) / 10}h`;
const areaOf = (addr) => (addr ?? "").replace(/^경기도\s*/, "");
const dongOf = (addr) => (addr ?? "").trim().split(/\s+/).pop() ?? "";
const shortCenter = (name) => name.replace(" 온케어 방문요양센터", "센터").replace("온케어 ", "");

export const stateMeta = {
  assigned: { tone: "ok", label: "배정 완료" },       // 근무기록 확정(요양보호사 수락)
  pending: { tone: "warning", label: "수락 대기" },     // 근무기록 배정(요양보호사 수락 전)
  review: { tone: "warning", label: "확인 필요" },
  unassigned: { tone: "danger", label: "미배정" },
};

const allCenter = { id: "all", name: "전체 센터", short: "전체 센터 통합" };

// 각 화면이 axios로 조회한 목록만 채워 넣고, 나머지는 빈 배열로 두기 위한 기본값
export const emptyRaw = { centers: [], careworkers: [], guardians: [], recipients: [], users: [], requests: [], reports: [] };

// 센터 목록 : [전체 센터, ...백엔드 센터] (센터 선택 드롭다운과 센터명 표시에 사용)
export const buildCenters = (rawCenters) => [allCenter, ...rawCenters.map((c) => ({ id: c.centerNo, name: c.centerName, short: shortCenter(c.centerName) }))];
const WEEK_DATES = Array.from({ length: 6 }, (_, i) => addDays(WEEK_START, i));
const scheduleDays = WEEK_DATES.map((iso) => `${DAY_KR[parseDate(iso).getDay()]} ${parseDate(iso).getDate()}`);

export const emptyModel = {
  centers: [allCenter],
  centerName: () => allCenter.name,
  caregivers: [],
  recipients: [],
  guardians: [],
  todayVisits: [],
  weekTable: [],
  scheduleDays,
  assignments: [],
  stateMeta,
  vacancyEvents: [],
};

// opts.weekStart : 방문 일정 표가 보여 줄 주의 월요일(yyyy-MM-dd). 없으면 이번 주
export function buildAdminModel(raw, opts = {}) {
  const viewDates = opts.weekStart ? Array.from({ length: 6 }, (_, i) => addDays(opts.weekStart, i)) : WEEK_DATES;
  const viewDays = viewDates.map((iso) => `${DAY_KR[parseDate(iso).getDay()]} ${parseDate(iso).getDate()}`);
  const centers = buildCenters(raw.centers);
  const centerName = (id) => centers.find((c) => c.id === id)?.name ?? allCenter.name;

  const cwById = new Map(raw.careworkers.map((c) => [c.careworkerNo, c]));
  const recById = new Map(raw.recipients.map((r) => [r.careRecipientNo, r]));
  const reqById = new Map(raw.requests.map((r) => [r.requestNo, r]));
  const phoneByUser = new Map(raw.users.map((u) => [u.userNo, u.phoneNumber]));

  const reports = raw.reports.map((rp) => {
    const req = reqById.get(rp.requestNo);
    return { ...rp, cw: cwById.get(rp.careworkerNo), req, rec: req ? recById.get(req.carerecipientNo) : undefined, cancelled: rp.workStatus === "취소", off: rp.workStatus === "취소" };
  });
  // 요청마다 "지금 유효한" 근무기록만 (취소·거절된 기록은 제외)
  const reportByReq = new Map(reports.filter((r) => !r.off).map((r) => [r.requestNo, r]));
  // 요청별 취소(거절·확정 후 취소)된 요양보호사 이름
  const cancelledByReq = new Map();
  reports.filter((r) => r.cancelled).forEach((r) => cancelledByReq.set(r.requestNo, [...(cancelledByReq.get(r.requestNo) ?? []), r.cw?.careworkerName ?? "요양보호사"]));
  // 취소된 근무기록이 있는 요청 (결원 관리에서 다루므로 미배정 목록과 중복 표시하지 않음)
  const vacancyReq = new Set(reports.filter((r) => r.cancelled).map((r) => r.requestNo));
  const weekSet = new Set(WEEK_DATES);
  const monthPrefix = WEEK_START.slice(0, 7);

  const caregivers = raw.careworkers.map((cw) => {
    const mine = reports.filter((r) => r.careworkerNo === cw.careworkerNo);
    const active = mine.filter((r) => !r.off);
    const week = Math.round(active.filter((r) => weekSet.has(r.workDate)).reduce((s, r) => s + hoursBetween(r.workStartTime, r.workEndTime), 0) * 10) / 10;
    const month = active.filter((r) => r.workDate?.startsWith(monthPrefix)).length;
    const over = week >= WEEK_LIMIT;
    const near = week >= 48;
    return {
      id: cw.careworkerNo,
      name: cw.careworkerName,
      gender: (cw.careworkerGender ?? "-")[0],
      area: areaOf(cw.careworkerAddress),
      days: "-",
      week,
      month,
      status: over ? "초과 위험" : near ? "주의" : cw.careworkerState ?? "정상",
      tone: over ? "danger" : near ? "warning" : "ok",
      center: cw.centerNo,
      raw: cw,
      records: mine
        .slice()
        .sort((a, b) => (b.workDate ?? "").localeCompare(a.workDate ?? ""))
        .map((r) => [r.workDate ? mdLabel(r.workDate) : "-", r.rec?.careRecipientName ?? "-", range(r.workStartTime, r.workEndTime), fmtHours(hoursBetween(r.workStartTime, r.workEndTime)), r.workStatus ?? "-", r.careworkersReportNo]),
    };
  });

  const recipientsBase = raw.recipients.map((r) => {
    const g = raw.guardians.find((x) => x.guardianNo === r.guardianNo);
    const reqs = raw.requests.filter((q) => q.carerecipientNo === r.careRecipientNo).sort((a, b) => (b.visitDate ?? "").localeCompare(a.visitDate ?? ""));
    const live = reqs.filter((q) => q.requestState !== "취소");
    const cw = live.map((q) => reportByReq.get(q.requestNo)).find((rp) => rp && !rp.cancelled)?.cw;
    const anyCw = reqs.map((q) => reportByReq.get(q.requestNo)).find((rp) => rp?.cw)?.cw;
    const schedule = [...new Set(live.filter((q) => q.visitDate).map((q) => `${DAY_KR[parseDate(q.visitDate).getDay()]}요일|${range(q.visitStartTime, q.visitEndTime)}`))].map((s) => s.split("|"));
    const pending = reqs[0]?.requestState === "신청";
    return {
      id: r.careRecipientNo,
      raw: r,
      guardianNo: r.guardianNo,
      name: r.careRecipientName,
      gender: (r.careRecipientGender ?? "-")[0],
      grade: `${r.careRecipientAge}세`,
      area: areaOf(r.careRecipientAddress),
      guardian: g ? `${g.guardianName} (${g.guardianRelationship})` : "-",
      cg: cw?.careworkerName ?? "미배정",
      tone: cw ? "ok" : "warning",
      status: cw ? "돌봄 중" : pending ? "배정 대기" : "담당 조정 필요",
      center: (cw ?? anyCw)?.centerNo ?? null,
      schedule,
      history: reqs.filter((q) => q.requestState === "완료").map((q) => [mdLabel(q.visitDate), reportByReq.get(q.requestNo)?.cw?.careworkerName ?? "-", q.requestContent ?? ""]),
    };
  });
  const guardianCenter = (no) => recipientsBase.find((r) => r.guardianNo === no && r.center != null)?.center ?? null;
  const recipients = recipientsBase.map((r) => ({ ...r, center: r.center ?? guardianCenter(r.guardianNo) }));

  const guardians = raw.guardians.map((g) => ({
    id: g.guardianNo,
    name: g.guardianName,
    tel: phoneByUser.get(g.userNo) ?? "-",
    relation: g.guardianRelationship,
    joined: typeof g.createDate === "string" ? g.createDate.slice(0, 10).replaceAll("-", ".") : "-",
    status: "정상",
    tone: "ok",
    center: guardianCenter(g.guardianNo),
    recipients: recipients.filter((r) => r.guardianNo === g.guardianNo).map((r) => ({ name: r.name, area: r.area, cg: r.cg })),
  }));

  const todayIso = TODAY.slice(0, 10).replaceAll(".", "-");
  const todayVisits = reports
    .filter((r) => !r.off && r.workDate === todayIso)
    .map((r) => ({ t: range(r.workStartTime, r.workEndTime), name: r.rec?.careRecipientName ?? "-", area: areaOf(r.rec?.careRecipientAddress), cg: r.cw?.careworkerName ?? "-", center: r.cw?.centerNo }))
    .sort((a, b) => a.t.localeCompare(b.t));

  const weekTable = raw.careworkers.map((cw) => ({
    id: cw.careworkerNo,
    cg: cw.careworkerName,
    center: cw.centerNo,
    cells: viewDates.map((date) =>
      reports
        .filter((r) => r.careworkerNo === cw.careworkerNo && !r.off && r.workDate === date)
        .map((r) => ({ t: range(r.workStartTime, r.workEndTime), name: r.rec?.careRecipientName ?? "-", area: dongOf(r.rec?.careRecipientAddress), st: r.workStatus })),
    ),
  }));

  const upcoming = raw.requests
    .filter((q) => q.requestState !== "취소" && q.visitDate >= WEEK_START)
    .sort((a, b) => `${a.visitDate}${toHhmm(a.visitStartTime)}`.localeCompare(`${b.visitDate}${toHhmm(b.visitStartTime)}`));
  const assignments = upcoming.map((q) => {
    const rp = reportByReq.get(q.requestNo);
    const cw = rp && !rp.off ? rp.cw : null;
    const rec = recipients.find((r) => r.id === q.carerecipientNo);
    return {
      requestNo: q.requestNo,
      requestState: q.requestState,
      reportNo: cw ? rp.careworkersReportNo : null,
      careworkerNo: cw ? cw.careworkerNo : null,
      iso: q.visitDate,
      start: q.visitStartTime,
      end: q.visitEndTime,
      recipient: rec?.name ?? "-",
      date: mdLabel(q.visitDate),
      time: range(q.visitStartTime, q.visitEndTime),
      cg: cw?.careworkerName ?? "미배정",
      score: 0,
      reportStatus: cw ? rp.workStatus : null,
      state: !cw ? "unassigned" : rp.workStatus === "확정" || rp.workStatus === "완료" ? "assigned" : "pending",
      center: cw?.centerNo ?? rec?.center ?? null,
      reasons: [...(cancelledByReq.get(q.requestNo) ?? []).map((n) => `${n} 요양보호사 취소 · 재배정 필요`), ...(q.requestContent ? [q.requestContent] : [])],
    };
  });

  const inMonth = (iso) => iso?.startsWith(monthPrefix);
  const vacancyEvents = [
    ...reports.filter((r) => r.cancelled && inMonth(r.workDate)).map((r) => ({
      date: parseDate(r.workDate).getDate(),
      kind: "vacancy",
      count: 1,
      center: r.cw?.centerNo ?? null,
      recipient: r.rec?.careRecipientName ?? "-",
      cg: r.cw?.careworkerName ?? "미배정",
      dateLabel: koDateLabel(r.workDate),
      time: range(r.workStartTime, r.workEndTime),
      area: areaOf(r.rec?.careRecipientAddress),
      reason: `${r.cw?.careworkerName ?? "담당자"} 요양보호사 · 근무 취소${r.req?.requestContent ? ` (${r.req.requestContent})` : ""}`,
      deadline: "",
      subs: [],
    })),
    ...raw.requests.filter((q) => q.requestState === "신청" && !reportByReq.get(q.requestNo) && !vacancyReq.has(q.requestNo) && inMonth(q.visitDate)).map((q) => {
      const rec = recipients.find((r) => r.id === q.carerecipientNo);
      return {
        date: parseDate(q.visitDate).getDate(),
        kind: "unassigned",
        count: 1,
        center: rec?.center ?? null,
        recipient: rec?.name ?? "-",
        cg: "미배정",
        dateLabel: koDateLabel(q.visitDate),
        time: range(q.visitStartTime, q.visitEndTime),
        area: rec?.area ?? "",
        reason: `배정 대기${q.requestContent ? ` · ${q.requestContent}` : ""}`,
        deadline: "",
        subs: [],
      };
    }),
  ];

  return { centers, centerName, caregivers, recipients, guardians, todayVisits, weekTable, scheduleDays: viewDays, assignments, stateMeta, vacancyEvents };
}
