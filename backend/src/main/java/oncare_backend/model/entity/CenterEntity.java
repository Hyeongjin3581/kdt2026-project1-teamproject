package oncare_backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "center")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CenterEntity {
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Integer centerNo;

    private String centerName;
    private String centerAddress;
    private String centerPhonenumber;

}
