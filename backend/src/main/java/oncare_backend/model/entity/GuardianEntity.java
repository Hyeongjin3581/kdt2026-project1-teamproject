package oncare_backend.model.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity 
@Table (name="guardians")
@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class GuardianEntity extends BaseTime{
    // PK 설정
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    @Column(name = "guardian_no")
    private Integer guardianNo;

    @OneToOne
    @JoinColumn(name = "user_no", nullable = false, unique = true)
    private UserEntity userEntity;

    @Column(nullable = false , length = 10)
    private String guardianName;

    @Column(nullable = false , length = 20)
    private String guardianRelationship;

    // use: 이용 중, delete: 탈퇴 (기존 데이터는 보존)
    @Column(name = "guardian_State", nullable = false, length = 20,
            columnDefinition = "varchar(20) not null default 'use'")
    @Builder.Default
    private String guardianState = "use";

    @OneToMany(mappedBy = "guardianEntity")
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<CareRecipientEntity> careRecipients = new ArrayList<>();
}
