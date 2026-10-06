package oncare_backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "careworkers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareworkerEntity extends BaseTime{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer careworkerNo;

    private String careworkerName;
    private String careworkerAddress;
    private String careworkerGender;
    private Integer hourWage;
    private Integer careworkerAge;
    private String careworkerState;
    // 가입상태 컬럼: DB 기본값과 Builder 기본값을 승인대기로 설정
    @Column(name = "sign_state", nullable = false, length = 10,
            columnDefinition = "varchar(10) not null default '승인대기'")
    @Default
    private String signState = "승인대기";
    private double latitude; // 위도
    private double longitude; // 경도

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "center_no")
    private CenterEntity centerEntity;

    // @ManyToOne(fetch = FetchType.LAZY) 
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_no")
    private UserEntity userEntity;
}