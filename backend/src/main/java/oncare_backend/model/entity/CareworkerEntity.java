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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "center_no")
    private CenterEntity centerEntity;

    // @ManyToOne(fetch = FetchType.LAZY) 
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_no")
    private UserEntity userEntity;
}