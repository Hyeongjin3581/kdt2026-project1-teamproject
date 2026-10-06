import { TODAY } from "../constants";
import { toHhmm } from "./timeFormat";

// 보호자 화면용 데이터 변환 (axios 로 받아온 백엔드 DTO -> 화면에서 쓰는 모양)
const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");
const parseDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmm = toHhmm;

export const todayIso = TODAY.slice(0, 10).replaceAll(".", "-");

// "월 09.15" / "09.17 (수)"
const dayLabel = (iso) => { const d = parseDate(iso); return `${DAY_KR[d.getDay()]} ${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
const dateLabel = (iso) => { const d = parseDate(iso); return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${DAY_KR[d.getDay()]})`; };

// 오늘이 속한 주(월~일) 범위
export function thisWeek() {
    const d = parseDate(todayIso);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const start = toIso(d);
    d.setDate(d.getDate() + 6);
    const end = toIso(d);
    return { start, end, label: `${start.replaceAll("-", ".")} ~ ${end.slice(5).replace("-", ".")}` };
}

// "월" -> 오늘 이후 가장 가까운 해당 요일 날짜(yyyy-MM-dd)
export function nextDateOf(dayKr) {
    const d = parseDate(todayIso);
    do { d.setDate(d.getDate() + 1); } while (DAY_KR[d.getDay()] !== dayKr);
    return toIso(d);
}

// 백엔드 수급자 -> 보호자 화면의 수급자 모양
export const toRecipient = (r) => ({
    id: r.careRecipientNo,
    raw: r,
    guardianNo: r.guardianNo,
    name: r.careRecipientName,
    age: String(r.careRecipientAge ?? ""),
    address: (r.careRecipientAddress ?? "").replace(/^경기도\s*/, ""),
    gender: r.careRecipientGender === "남자" ? "male" : "female",
    significant: r.careRecipientContent ?? "",
});

// 방문 요청 + 근무기록 + 요양보호사 -> 방문 일정 행
export function buildVisits({ requests, reports, careworkers }) {
    const cwById = new Map(careworkers.map((c) => [c.careworkerNo, c]));
    const reportByReq = new Map(reports.filter((r) => r.workStatus !== "취소").map((r) => [r.requestNo, r])); // 취소된 기록은 제외
    return requests
        .filter((q) => q.visitDate)
        .map((q) => {
            const report = reportByReq.get(q.requestNo);
            const cw = report && (report.workStatus === "확정" || report.workStatus === "완료") ? cwById.get(report.careworkerNo) : null; // 요양보호사가 수락(확정)한 뒤에만 표시
            const cancelled = q.requestState === "취소";
            const done = q.requestState === "완료" || report?.workStatus === "완료";
            const isToday = q.visitDate === todayIso;
            const status = cancelled ? "취소" : done ? "방문 완료" : isToday ? "오늘 예정" : q.requestState === "신청" ? "배정 대기" : q.requestState === "배정중" ? "요양보호사 확인 중" : "예정";
            return {
                id: q.requestNo,
                iso: q.visitDate,
                day: dayLabel(q.visitDate),
                date: dateLabel(q.visitDate),
                t: `${hhmm(q.visitStartTime)}~${hhmm(q.visitEndTime)}`,
                time: `${hhmm(q.visitStartTime)} ~ ${hhmm(q.visitEndTime)}`,
                cg: cw?.careworkerName ?? "배정 예정",
                caregiver: cw ? `${cw.careworkerName} 요양보호사` : "배정 예정",
                service: q.requestContent ?? "방문요양 서비스",
                note: q.requestContent ?? "",
                status,
                label: status,
                tone: cancelled ? "neutral" : done ? "ok" : isToday ? "info" : "neutral",
                cancelled,
                done,
            };
        })
        .sort((a, b) => a.iso.localeCompare(b.iso));
}

// 문의(보호자 단위) + 서비스 신청(수급자 단위) -> 요청 내역
export function buildHistory({ inquiries, categories, requests }) {
    const nameOf = new Map(categories.map((c) => [c.inquiryCategoryNo, c.inquiryCategoryName]));
    const stateTone = { 완료: "ok", 취소: "neutral", 신청: "info", 배정중: "warning", 배정완료: "ok" };
    const fromInquiries = inquiries.map((i) => {
        const type = nameOf.get(i.inquiryCategoryNo) ?? "문의";
        const created = typeof i.createDate === "string" ? i.createDate.slice(0, 10) : i.wishDate ?? "-";
        const wish = i.wishDate ? `${i.wishDate} ${hhmm(i.wishStartTime)}~${hhmm(i.wishEndTime)}` : "-";
        return {
            id: `INQ-${i.inquiryNo}`,
            source: "inquiry",
            raw: i,
            date: created,
            kind: type.includes("문의") ? "문의" : "요청",
            type,
            service: "방문요양 서비스",
            status: "접수 완료",
            tone: "info",
            summary: (i.inquiryContent ?? "").slice(0, 40),
            details: [["문의 유형", type], ["희망 일정", wish], ["요청 내용", i.inquiryContent ?? "-"]],
        };
    });
    const fromRequests = requests.map((q) => ({
        id: `REQ-${q.requestNo}`,
        source: "request",
        raw: q,
        date: q.visitDate ?? "-",
        kind: "신청",
        type: "방문요양 서비스 신청",
        service: "방문요양 서비스",
        status: q.requestState ?? "신청",
        tone: stateTone[q.requestState] ?? "info",
        summary: (q.requestContent ?? "").slice(0, 40),
        details: [["방문 일정", `${q.visitDate ?? "-"} ${hhmm(q.visitStartTime)}~${hhmm(q.visitEndTime)}`], ["요청 내용", q.requestContent ?? "-"], ["진행 상태", q.requestState ?? "-"]],
    }));
    return [...fromInquiries, ...fromRequests].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
