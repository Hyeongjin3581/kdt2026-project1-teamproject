package oncare_backend.model.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.GuardianInquiryEntity;

@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class GuardianInquiryDto {
    private Integer inquiryNo;                     // 문의번호
    private Integer guardianNo;                 // 보호자 번호 FK
    private Integer inquiryCategoryNo;    // 문의 카테고리 FK
    private LocalDate wishDate;                // 희망 날짜
    private Integer wishStartTime;      // 희망 시작시간
    private Integer wishEndTime;       // 희망 종료시간
    private String inquiryContent;           // 요청 내용

    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    public GuardianInquiryEntity dtoToEntity(){
        return GuardianInquiryEntity.builder()
        .guardianNo(this.guardianNo)
        .inquiryCategoryNo(this.inquiryCategoryNo)
        .wishDate(this.wishDate)
        .wishStartTime(this.wishStartTime)
        .wishEndTime(this.wishEndTime)
        .inquiryContent(this.inquiryContent)
        .build();
    }

    public static GuardianInquiryDto entityToDto(GuardianInquiryEntity entity){
       return GuardianInquiryDto.builder()
    .inquiryNo(entity.getInquiryNo())
    .guardianNo(entity.getGuardianNo())
    .inquiryCategoryNo(entity.getInquiryCategoryNo())
    .wishDate(entity.getWishDate())
    .wishStartTime(entity.getWishStartTime())
    .wishEndTime(entity.getWishEndTime())
    .inquiryContent(entity.getInquiryContent())
    .createDate(entity.getCreateDate())
    .updateDate(entity.getUpdateDate())
    .build();
    }
}

// 보호자 문의 생성 / 보호자 문의 삭제..? / 보호자 문의 수정,,, ㅇㅇ / 보호자 문의 조회(관리자)