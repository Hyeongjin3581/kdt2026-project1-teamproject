package oncare_backend.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "center")
public class CenterEntity {
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Integer centerNo;

    private String centerName;
    private String centerAddress;
    private String centerPhonenumber;

}
