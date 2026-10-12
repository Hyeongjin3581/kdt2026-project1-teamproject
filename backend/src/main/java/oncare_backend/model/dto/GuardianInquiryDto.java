package oncare_backend.model.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.GuardianInquiryEntity;
import oncare_backend.model.entity.RequestEntity;

@NoArgsConstructor @AllArgsConstructor @Data @Builder
public class GuardianInquiryDto {
    private Integer inquiryNo;                     // 문의번호
    private Integer guardianNo;                 // 보호자 번호 FK
    private Integer inquiryCategoryNo;    // 문의 카테고리 FK
    private LocalDate wishDate;                // 희망 날짜
    private Integer wishStartTime;      // 희망 시작시간
    private Integer wishEndTime;       // 희망 종료시간
    private String inquiryContent;           // 요청 내용

    private Integer requestNo;            // 문의 대상 방문(서비스 요청) 번호 FK
    private String inquiryGroup;          // 묶음 번호 (한 번에 함께 보낸 문의끼리 같은 값)

    private String answerContent;         // 관리자 응답 (null 이면 응답 대기)
    private LocalDateTime answerDate;     // 응답 일시
    private LocalDateTime scheduleAppliedDate; // 이 문의로 배정 변경한 일시 (안 했으면 null)

    // 관리자 응답 팝업 표시용 (조회 전용, 저장할 때는 쓰지 않음)
    private Integer careRecipientNo;      // 수급자 번호
    private String careRecipientName;     // 수급자 이름
    private LocalDate visitDate;          // 현재 방문 날짜
    private Integer visitStartTime;       // 현재 방문 시작시간
    private Integer visitEndTime;         // 현재 방문 종료시간
    private String requestState;          // 현재 요청 상태 (신청/배정중/배정완료/완료/취소)

    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    // requestEntity 는 Service 에서 조회해서 넣는다
    public GuardianInquiryEntity dtoToEntity(){
        return GuardianInquiryEntity.builder()
        .wishDate(this.wishDate)
        .wishStartTime(this.wishStartTime)
        .wishEndTime(this.wishEndTime)
        .inquiryContent(this.inquiryContent)
        .inquiryGroup(this.inquiryGroup)
        .build();
    }

    public static GuardianInquiryDto entityToDto(GuardianInquiryEntity entity){
        GuardianInquiryDto dto = GuardianInquiryDto.builder()
            .inquiryNo(entity.getInquiryNo())
            .guardianNo(entity.getGuardianEntity().getGuardianNo())
            .inquiryCategoryNo(entity.getInquiryCategoryEntity().getInquiryCategoryNo())
            .wishDate(entity.getWishDate())
            .wishStartTime(entity.getWishStartTime())
            .wishEndTime(entity.getWishEndTime())
            .inquiryContent(entity.getInquiryContent())
            .inquiryGroup(entity.getInquiryGroup())
            .answerContent(entity.getAnswerContent())
            .answerDate(entity.getAnswerDate())
            .scheduleAppliedDate(entity.getScheduleAppliedDate())
            .createDate(entity.getCreateDate())
            .updateDate(entity.getUpdateDate())
            .build();

        // 방문이 연결된 문의만 방문 정보를 채운다 (예전 데이터·기타 문의는 null → NPE 방지)
        RequestEntity request = entity.getRequestEntity();
        if (request != null) {
            dto.setRequestNo(request.getRequestNo());
            dto.setVisitDate(request.getVisitDate());
            dto.setVisitStartTime(request.getVisitStartTime());
            dto.setVisitEndTime(request.getVisitEndTime());
            dto.setRequestState(request.getRequestState());
            if (request.getCarerecipientEntity() != null) {
                dto.setCareRecipientNo(request.getCarerecipientEntity().getCareRecipientNo());
                dto.setCareRecipientName(request.getCarerecipientEntity().getCareRecipientName());
            }
        }
        return dto;
    }
}

// 보호자 문의 생성 / 보호자 문의 삭제..? / 보호자 문의 수정,,, ㅇㅇ / 보호자 문의 조회(관리자)
