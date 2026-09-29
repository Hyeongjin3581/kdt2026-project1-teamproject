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

    private Integer userCategoryNo;
    private String userCategoryName;

    public UserEntity dtoToEntity(){
        return UserEntity.builder()
                .userId(this.userId)
                .userPassword(this.userPassword)
                .phoneNumber(this.phoneNumber).build();
    }

    public static UserDto entityToDto(UserEntity user){
        return UserDto.builder()
                .userNo(user.getUserNo())
                .userId(user.getUserId())
                .userPassword(user.getUserPassword())
                .phoneNumber(user.getPhoneNumber())
                .userCategoryName(user.getUserCategoryEntity().getUserCategoryName()).build();
    }
}
