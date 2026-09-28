package oncare_backend.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity 
@Table (name="guardians")
@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class GuardianEntity extends BaseTime{
    // PK 설정
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    @Column(name = "guardian_no")
    private Integer guardianNo;

    // FK를 joinColumn 으로 받아옴. 
    @JoinColumn(name = "user_no", nullable = false, unique = true)
    @ManyToOne
    private Integer userNo;

    @Column(nullable = false , length = 10)
    private String guardianName;

    @Column(nullable = false , length = 20)
    private String guardianRelationship;
}
