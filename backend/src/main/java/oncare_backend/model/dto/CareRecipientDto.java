package oncare_backend.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.CareRecipientEntity;

@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class CareRecipientDto {
    private Integer carerecipient_no;               // 수급자 번호
    private Integer guardian_no;                     // 보호자 번호 FK
    private String carerecipient_name;            // 수급자 성명
    private Integer carerecipient_age;             // 수급자 나이
    private String carerecipient_address;        // 수급자 거주지역
    private Boolean carerecipient_gender;    // 수급자 성별
    private String careRecipient_content;     // 수급자 특이사항

    // BaseTime 시간 멤버변수 생성
    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    // Dto에서 Entity로 변환
    public CareRecipientEntity toEntity(){
        return CareRecipientEntity.builder()
        .guardian_no(this.guardian_no)
        .carerecipient_name(this.carerecipient_name)
        .carerecipient_age(this.carerecipient_age)
        .carerecipient_address(this.carerecipient_address)
        .carerecipient_gender(this.carerecipient_gender)
        .careRecipient_content(this.careRecipient_content)
        .build();
    }

    // Entity에서 Dto로 변환 
    public static CareRecipientDto from(CareRecipientEntity entity){
        return CareRecipientDto.builder()
        .carerecipient_no(entity.getCarerecipient_no())
        .guardian_no(entity.getGuardian_no())
        .carerecipient_name(entity.getCarerecipient_name())
        .carerecipient_age(entity.getCarerecipient_age())
        .carerecipient_address(entity.getCarerecipient_address())
        .carerecipient_gender(entity.getCarerecipient_gender())
        .careRecipient_content(entity.getCareRecipient_content())
        .createDate(entity.getCreateDate())
        .updateDate(entity.getUpdateDate())
        .build();
    }
}


// 수급자 등록(생성)  , 수급자 해제(삭제) , 수급자 특이사항(변경) / 주소(변경) , 수급자 조회(조회)