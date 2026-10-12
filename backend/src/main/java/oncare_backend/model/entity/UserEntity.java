package oncare_backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer userNo;

    @Column(unique = true)
    private String userId;
    private String userPassword;
    private String phoneNumber;
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_category_no")
    private UserCategoryEntity userCategoryEntity;

    // use: 이용 중, delete: 탈퇴 (기존 데이터는 보존)
    @Column(name = "user_state", nullable = false, length = 20,
            columnDefinition = "varchar(20) not null default 'use'")
    @Builder.Default
    private String userState = "use";

}