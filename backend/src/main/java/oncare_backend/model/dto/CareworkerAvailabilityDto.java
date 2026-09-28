package oncare_backend.model.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.CareworkerAvailabilityEntity;
import oncare_backend.model.entity.CareworkerEntity;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareworkerAvailabilityDto {

    private Integer availabilityNo;

    private LocalDate availableDate;
        private LocalTime startTime;
        private LocalTime endTime;
    private String status;

    private Integer careworkerNo;


    // DTO -> Entity
    public CareworkerAvailabilityEntity dtoToEntity() {
        return CareworkerAvailabilityEntity.builder()
                .availableDate(this.availableDate)
                .startTime(this.startTime)
                .endTime(this.endTime)
                .status(this.status)
                .careworkerEntity(this.careworkerNo == null ? null : CareworkerEntity.builder()
                        .careworkerNo(this.careworkerNo)
                        .build())
                .build();
    }


    // Entity -> DTO
    public static CareworkerAvailabilityDto entityToDto(
            CareworkerAvailabilityEntity availability) {

        return CareworkerAvailabilityDto.builder()
                .availabilityNo(availability.getAvailabilityNo())
                .availableDate(availability.getAvailableDate())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .status(availability.getStatus())
                .careworkerNo(availability.getCareworkerEntity() == null
                        ? null : availability.getCareworkerEntity().getCareworkerNo())
                .build();
    }
}