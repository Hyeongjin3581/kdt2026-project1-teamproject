package oncare_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.UserCategoryEntity;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserCategoryDto {
    private Integer userCategoryNo;
    private String userCategoryName;

    public UserCategoryEntity dtoToEntity(){
        return UserCategoryEntity.builder()
                .userCategoryNo(this.userCategoryNo)
                .userCategoryName(this.userCategoryName).build();
    }

    public static UserCategoryDto entityToDto(UserCategoryEntity userCategory){
        return UserCategoryDto.builder()
                .userCategoryName(userCategory.getUserCategoryName())
                .userCategoryNo(userCategory.getUserCategoryNo()).build();
    }
}
