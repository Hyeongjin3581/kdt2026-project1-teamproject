package oncare_backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "caregiverAvailability")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareworkerAvailabilityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer availabilityNo;

    private LocalDate availableDate;
    private Integer startTime;
    private Integer endTime;
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caregiver_no")
    private CareworkerEntity careworkerEntity;

}