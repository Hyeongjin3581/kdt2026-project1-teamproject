//
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
    gender: r.careRecipientGender === "남자" ? "male" : r.careRecipientGender === "여자" ? "female" : "unknown",
    significant: r.careRecipientContent ?? "",
});

// 요청 상태(requestState)별 배지 색 : 신청 -> 배정중 -> 배정완료 -> 완료, 취소
const stateTone = { 신청: "info", 배정중: "warning", 배정완료: "ok", 완료: "ok", 취소: "neutral" };

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
            const status = q.requestState ?? "신청"; // 방문 일정에는 요청 상태(requestState)를 그대로 보여 준다
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
                tone: stateTone[status] ?? "neutral",
                cancelled,
                done,
                reportNo: report?.careworkersReportNo,       // 채팅방 번호로 쓸 근무기록 번호
                chatOpen: report?.workStatus === "확정",       // 확정일 때만 채팅 가능
            };
        })
        .sort((a, b) => a.iso.localeCompare(b.iso));
}

// 문의(보호자 단위) + 서비스 신청(수급자 단위) -> 요청 내역
export function buildHistory({ inquiries, categories, requests }) {
    const nameOf = new Map(categories.map((c) => [c.inquiryCategoryNo, c.inquiryCategoryName]));
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

// API의 필드명을 기존 화면에서 사용하던 이름으로 맞춥니다.
// 수급자 Boolean 성별의 남녀 기준은 팀에서 확정하기 전까지 추측하지 않습니다.
export const normalizeGuardian = (g) => ({
    ...g, guardianNo: g.guardian_no, userNo: g.user_no,
    guardianName: g.guardian_name, guardianRelationship: g.guardian_relationship,
});
export const normalizeRecipient = (r) => ({
    ...r, careRecipientNo: r.carerecipient_no, guardianNo: r.guardian_no,
    careRecipientName: r.carerecipient_name, careRecipientAge: r.carerecipient_age,
    careRecipientAddress: r.carerecipient_address, careRecipientGender: "미확인",
    careRecipientContent: r.careRecipient_content,
});
export const normalizeInquiry = (i) => ({
    ...i, inquiryNo: i.inquiry_no, guardianNo: i.guardian_no,
    inquiryCategoryNo: i.inquiry_category_no, wishDate: i.wish_date,
    wishStartTime: i.wish_start_time, wishEndTime: i.wish_end_time, inquiryContent: i.inquiry_content,
});
export const normalizeCategory = (c) => ({
    ...c, inquiryCategoryNo: c.inquiry_category_no, inquiryCategoryName: c.inquiry_category_name,
});
export const inquiryPayload = (i) => ({
    guardian_no: i.guardianNo, inquiry_category_no: i.inquiryCategoryNo,
    wish_date: i.wishDate ?? null, wish_start_time: i.wishStartTime ?? null,
    wish_end_time: i.wishEndTime ?? null, inquiry_content: i.inquiryContent,
});
export function recipientPayload(r) {
    if (typeof r.carerecipient_gender !== "boolean") {
        throw new Error("수급자 성별의 남녀 Boolean 기준을 먼저 확정해야 합니다.");
    }
    return {
        guardian_no: r.guardianNo, carerecipient_name: r.careRecipientName,
        carerecipient_age: r.careRecipientAge, carerecipient_address: r.careRecipientAddress,
        carerecipient_gender: r.carerecipient_gender, careRecipient_content: r.careRecipientContent,
    };
}
