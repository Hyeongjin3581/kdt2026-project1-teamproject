package oncare_backend.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.CareRecipientEntity;

@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class CareRecipientDto {
    private Integer careRecipientNo;               // 수급자 번호
    private Integer guardianNo;                     // 보호자 번호 FK
    private String careRecipientName;            // 수급자 성명
    private Integer careRecipientAge;             // 수급자 나이
    private String careRecipientAddress;        // 수급자 거주지역
    private Boolean careRecipientGender;    // 수급자 성별
    private String careRecipientContent;     // 수급자 특이사항

    // BaseTime 시간 멤버변수 생성
    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    // Dto에서 Entity로 변환
    public CareRecipientEntity dtoToEntity(){
        return CareRecipientEntity.builder()
        .guardianNo(this.guardianNo)
        .careRecipientName(this.careRecipientName)
        .careRecipientAge(this.careRecipientAge)
        .careRecipientAddress(this.careRecipientAddress)
        .careRecipientGender(this.careRecipientGender)
        .careRecipientContent(this.careRecipientContent)
        .build();
    }

    // Entity에서 Dto로 변환 
    public static CareRecipientDto entityToDto(CareRecipientEntity entity){
        return CareRecipientDto.builder()
        .careRecipientNo(entity.getCareRecipientNo())
        .guardianNo(entity.getGuardianNo())
        .careRecipientName(entity.getCareRecipientName())
        .careRecipientAge(entity.getCareRecipientAge())
        .careRecipientAddress(entity.getCareRecipientAddress())
        .careRecipientGender(entity.getCareRecipientGender())
        .careRecipientContent(entity.getCareRecipientContent())
        .createDate(entity.getCreateDate())
        .updateDate(entity.getUpdateDate())
        .build();
    }
}


// 수급자 등록(생성)  , 수급자 해제(삭제) , 수급자 특이사항(변경) / 주소(변경) , 수급자 조회(조회)