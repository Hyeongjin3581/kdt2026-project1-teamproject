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

    public UserEntity dtoToEntity(){
        return UserEntity.builder()
                .userId(this.userId)
                .userPassword(this.userPassword)
                .email(this.email)
                .phoneNumber(this.phoneNumber).build();
    }

    public static UserDto entityToDto(UserEntity userEntity){
        return UserDto.builder()
                .userNo(userEntity.getUserNo())
                .userId(userEntity.getUserId())
                .userPassword(userEntity.getUserPassword())
                .phoneNumber(userEntity.getPhoneNumber())
                .email(userEntity.getEmail())
                .userCategoryName(userEntity.getUserCategoryEntity().getUserCategoryName()).build();
    }
}
