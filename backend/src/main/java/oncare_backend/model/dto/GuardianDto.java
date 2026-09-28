package oncare_backend.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.GuardianEntity;

@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class GuardianDto {
    private Integer guardianNo;                    // 보호자 번호
    private Integer userNo;                           // 사용자 번호 FK
    private String guardianName;                // 보호자 성명
    private String guardianRelationship;      // 수급자와의 관계

    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    // Dto에서 Entity로 변환
    public GuardianEntity dtoToEntity(){
        return GuardianEntity.builder()
        .userNo(this.userNo)
        .guardianName(this.guardianName)
        .guardianRelationship(this.guardianRelationship)
        .build();
    }

    public static GuardianDto entityToDto(GuardianEntity entity){
        return GuardianDto.builder()
        .guardianNo(entity.getGuardianNo())
        .userNo(entity.getUserNo())
        .guardianName(entity.getGuardianName())
        .guardianRelationship(entity.getGuardianRelationship())
        .createDate(entity.getCreateDate())
        .updateDate(entity.getUpdateDate())
        .build();
    }
}

// 보호자 등록(회원가입인데) ..?  / 보호자 개인정보 수정  / 보호자 계정 탈퇴 (마찬가지로 사용자(user)에서 관리)
// 보호자 조회(관리자)
// 그러면 (보호자 성함 , 수급자와의 관계) 조회용 DTO 
// 해당 DTO는 조회만 할듯..?
