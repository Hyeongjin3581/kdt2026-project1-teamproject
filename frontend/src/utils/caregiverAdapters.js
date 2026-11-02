import { toHhmm } from "./timeFormat";

// 요양보호사 화면용 변환 : 백엔드 DTO(번호로 연결된 데이터)를 화면이 쓰는 형태로 조합한다.
const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");

// 오늘 날짜 "yyyy-MM-dd" (실제 컴퓨터 날짜)
export const todayIso = (() => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; })();

// "2026-10-08" -> "10.08 (목)"
export const dateLabel = (iso) => {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad(m)}.${pad(d)} (${DAY_KR[new Date(y, m - 1, d).getDay()]})`;
};

// 근무기록 상태 -> 요양보호사에게 보여 줄 문구와 배지 색
export const visitStatusMeta = {
  배정: { label: "수락 대기", tone: "warning" },
  확정: { label: "확정", tone: "ok" },
  완료: { label: "방문 완료", tone: "info" },
  취소: { label: "취소", tone: "neutral" },
};

// 근무기록 + 요청 + 수급자 -> 방문 일정 행
// reports : CareworkerReportDto[]  { careworkersReportNo, requestNo, workDate, workStartTime, workEndTime, workStatus }
// requests : RequestDto[]          { requestNo, carerecipientNo, requestContent, ... }
// recipients : CareRecipientDto[]  { careRecipientNo, careRecipientName, careRecipientAddress, ... }
export function buildVisits({ reports, requests, recipients }) {
  const requestByNo = new Map(requests.map((q) => [q.requestNo, q]));
  const recipientByNo = new Map(recipients.map((r) => [r.careRecipientNo, r]));
  return reports
    .map((rp) => {
      const request = requestByNo.get(rp.requestNo);
      const recipient = request ? recipientByNo.get(request.carerecipientNo) : null;
      return {
        reportNo: rp.careworkersReportNo,
        requestNo: rp.requestNo,
        iso: rp.workDate,
        date: dateLabel(rp.workDate),
        start: rp.workStartTime,
        end: rp.workEndTime,
        time: `${toHhmm(rp.workStartTime)} ~ ${toHhmm(rp.workEndTime)}`,
        status: rp.workStatus,
        recipientName: recipient?.careRecipientName ?? "-",
        address: recipient?.careRecipientAddress ?? "-",
        content: request?.requestContent ?? "",
      };
    })
    .sort((a, b) => `${a.iso}${pad(a.start ?? 0)}`.localeCompare(`${b.iso}${pad(b.start ?? 0)}`));
}
