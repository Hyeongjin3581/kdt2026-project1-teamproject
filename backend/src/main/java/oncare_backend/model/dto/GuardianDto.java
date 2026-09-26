package oncare_backend.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.GuardianEntity;

@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class GuardianDto {
    private Integer guardian_no;
    private Integer user_no;
    private String guardian_name;
    private String guardian_relationship;

    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    // Dto에서 Entity로 변환
    public GuardianEntity toEntity(){
        return GuardianEntity.builder()
        .user_no(this.user_no)
        .guardian_name(this.guardian_name)
        .guardian_relationship(this.guardian_relationship)
        .build();
    }

    public static GuardianDto from(GuardianEntity entity){
        return GuardianDto.builder()
        .guardian_no(entity.getGuardian_no())
        .user_no(entity.getUser_no())
        .guardian_name(entity.getGuardian_name())
        .guardian_relationship(entity.getGuardian_relationship())
        .createDate(entity.getCreateDate())
        .updateDate(entity.getUpdateDate())
        .build();
    }
}

// 보호자 등록(회원가입인데) ..?  / 보호자 개인정보 수정  , 보호자 계정 탈퇴 (마찬가지로 사용자에서 관리)
// 보호자 조회(관리자)
// 그러면 (보호자 성함 , 수급자와의 관계) 조회용 DTO 
