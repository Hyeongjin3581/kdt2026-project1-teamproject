// 보호자 문의 응답 상태 (관리자 문의 관리 · 응답 팝업 · 보호자 요청 내역 공용)
//  - 응답 대기       : 관리자 응답(answerContent) 없음
//  - 응답 완료       : 응답 메시지만 보냄
//  - 응답 · 일정 변경 : 응답 + 이 문의의 희망 일정으로 배정 변경(scheduleAppliedDate 있음)
//    ※ '배정 완료'는 요양보호사가 수락까지 한 상태(요청 배정완료 / 근무기록 확정)와 헷갈려서 쓰지 않는다
export function inquiryStatus(inquiry) {
    if (!inquiry?.answerContent) return { label: "응답 대기", tone: "warning" };
    if (inquiry.scheduleAppliedDate) return { label: "응답 · 일정 변경", tone: "info" };
    return { label: "응답 완료", tone: "ok" };
}

// 연결된 방문의 '지금' 담당자 상태 (관리자 문의 관리 · 응답 팝업)
//  '응답 · 일정 변경' 은 방문 시간을 옮겼다는 뜻일 뿐, 담당자가 정해졌다는 뜻이 아니라서 따로 보여 준다
//  요청 상태(requestState)로 판단 : 배정 변경 때 근무기록 상태(배정/확정)와 함께 바뀐다
//    신청 → 담당 없음 / 배정중 → 수락 대기(근무기록 '배정') / 배정완료 → 담당 확정(근무기록 '확정')
const ASSIGNEE = {
    신청: { label: "담당 없음", tone: "danger" },
    배정중: { label: "수락 대기", tone: "warning" },
    배정완료: { label: "담당 확정", tone: "ok" },
    완료: { label: "방문 완료", tone: "neutral" },
    취소: { label: "방문 취소", tone: "neutral" },
};
export function assigneeStatus(inquiry) {
    return ASSIGNEE[inquiry?.requestState] ?? null; // 방문이 연결되지 않은 문의는 null
}
