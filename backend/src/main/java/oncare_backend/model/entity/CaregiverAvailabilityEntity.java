package oncare_backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "caregiveravailability")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaregiverAvailabilityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer availabilityNo;

    private LocalDate availableDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caregiver_no")
    private CareworkerEntity careworkerEntity;

}