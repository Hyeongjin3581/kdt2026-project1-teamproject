package oncare_backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "careworkers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareworkerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer careworkerNo;

    private String careworkerName;
    private String careworkerAddress;
    private String careworkerGender;
    private Integer hourWage;
    private Integer careworkerAge;
    private String careworkerState;
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