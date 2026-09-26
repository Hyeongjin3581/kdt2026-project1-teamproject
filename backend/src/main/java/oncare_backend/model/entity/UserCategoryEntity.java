package oncare_backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "userCategory")
@NoArgsConstructor @AllArgsConstructor @Data @Builder
public class UserCategoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer userCategoryNo;

    private String userCategoryName;

    @OneToMany(mappedBy = "userCategoryEntity", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    @ToString.Exclude
    private List<UserEntity> userEntities = new ArrayList<>();
}
