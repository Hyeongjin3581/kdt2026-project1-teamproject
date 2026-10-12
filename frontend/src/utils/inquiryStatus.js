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
