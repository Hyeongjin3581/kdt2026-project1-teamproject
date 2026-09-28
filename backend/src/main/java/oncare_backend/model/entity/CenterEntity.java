package oncare_backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

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

    /*@OneToMany(mappedBy = //"요양보호사엔티티")
    @Builder.Default
    @ToString.Exclude
    private List<CareworkersEntity> careworkersEntities = new ArrayList<>();*/

}
