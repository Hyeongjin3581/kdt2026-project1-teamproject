package oncare_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.UserEntity;
import oncare_backend.model.entity.UserCategoryEntity;

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
                .phoneNumber(this.phoneNumber)
                .userCategoryEntity(this.userCategoryNo == null ? null : UserCategoryEntity.builder()
                    .userCategoryNo(this.userCategoryNo)
                    .build())
                .build();
    }

    public static UserDto entityToDto(UserEntity user){
        return UserDto.builder()
                .userNo(user.getUserNo())
                .userId(user.getUserId())
                .userPassword(user.getUserPassword())
                .phoneNumber(user.getPhoneNumber())
                .email(user.getEmail())
                .userCategoryNo(user.getUserCategoryEntity() == null
                    ? null : user.getUserCategoryEntity().getUserCategoryNo())
                .userCategoryName(user.getUserCategoryEntity() == null
                    ? null : user.getUserCategoryEntity().getUserCategoryName())
                .build();
    }
}
