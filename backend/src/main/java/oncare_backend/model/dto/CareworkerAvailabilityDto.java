package oncare_backend.model.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.CareworkerAvailabilityEntity;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareworkerAvailabilityDto {

    private Integer availabilityNo;

    private LocalDate availableDate;
    private Integer startTime;
    private Integer endTime;
    private String status;

    private Integer careworkerNo;


    // DTO -> Entity
    public CareworkerAvailabilityEntity dtoToEntity() {
        return CareworkerAvailabilityEntity.builder()
                .availableDate(this.availableDate)
                .startTime(this.startTime)
                .endTime(this.endTime)
                .status(this.status)
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
                .careworkerNo(
                        availability.getCareworkerEntity().getCareworkerNo()
                )
                .build();
    }
}