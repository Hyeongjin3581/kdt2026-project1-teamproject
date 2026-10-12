package oncare_backend.model.dto;

import lombok.Data;

// 관리자 문의 응답 요청 (처음 응답 · 응답 수정 공용)
@Data
public class GuardianInquiryAnswerDto {
    private Integer inquiryNo;        // 응답할 문의 번호
    private String answerContent;     // 관리자 코멘트
    private Boolean applySchedule;    // true = '응답 송신 및 배정 변경', false/null = 응답만 저장
    private Integer careworkerNo;     // 배정 변경 시 선택한 요양보호사 (기존 근무자 or 추천 후보, 기존 담당자가 없으면 null 가능)
}
