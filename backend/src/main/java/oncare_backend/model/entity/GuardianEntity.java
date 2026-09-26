package oncare_backend.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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
    private Integer guardian_no;

    // FK를 joinColumn 으로 받아옴. 
    @JoinColumn(name = "user_no", nullable = false, unique = true)
    private Integer user_no;

    @Column(nullable = false , length = 10)
    private String guardian_name;

    @Column(nullable = false , length = 20)
    private String guardian_relationship;
}
