package oncare_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.UserEntity;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserDto {
    private Integer userNo;

    private String userId;
    private String userPassword;
    private String phoneNumber;
    private String email;
    
    private Integer userCategoryNo;
    private String userCategoryName;

    private String guardianName;          // 보호자 가입 시에만 사용
    private String guardianRelationship;  // 보호자 가입 시에만 사용

    public UserEntity dtoToEntity(){
        return UserEntity.builder()
                .userId(this.userId)
                .userPassword(this.userPassword)
                .email(this.email)
                .phoneNumber(this.phoneNumber)
                .build();
    }

    public static UserDto entityToDto(UserEntity user){
        return UserDto.builder()
                .userNo(user.getUserNo())
                .userId(user.getUserId())
                // .userPassword(user.getUserPassword()) // 뭐가 됐든 userDto들을 조회해버리면 비밀번호까지 노출돼서 주석처리 해 놓음
                .phoneNumber(user.getPhoneNumber())
                .email(user.getEmail())
                .userCategoryNo(user.getUserCategoryEntity().getUserCategoryNo())
                .userCategoryName(user.getUserCategoryEntity().getUserCategoryName())
                .build();
    }
}
