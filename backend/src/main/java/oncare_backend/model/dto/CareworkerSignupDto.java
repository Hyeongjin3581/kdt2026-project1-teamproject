package oncare_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareworkerSignupDto {
    // User 계정 생성에 필요한 정보
    private String userId;
    private String userPassword;
    private String phoneNumber;
    private String email;

    // 요양보호사 프로필 생성에 필요한 정보
    private String careworkerName;
    private String careworkerAddress;
    private String careworkerGender;
    
    // 시급은... 제외 하고 관리자가 수정 때 바꿔놓도록 하고싶긴한데 일단 보류
    private Integer hourWage;   

    private Integer careworkerAge;
    private String careworkerState;
    // 선택한 센터 번호: 서버에서 존재 여부를 확인한 뒤 프로필과 연결
    private Integer centerNo;
}
