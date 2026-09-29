package oncare_backend.model.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.CaregiverAvailabilityEntity;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaregiverAvailabilityDto {

    private Integer availabilityNo;
    private LocalDate availableDate;
    private Integer startTime;
    private Integer endTime;
    private String status;
    private Integer caregiverNo;

    private LocalDateTime createDate;
    private LocalDateTime updateDate;


    // DTO -> Entity
    public CaregiverAvailabilityEntity dtoToEntity() {
        return CaregiverAvailabilityEntity.builder()
                .availabilityNo(this.availabilityNo)
                .availableDate(this.availableDate)
                .startTime(this.startTime)
                .endTime(this.endTime)
                .status(this.status)
                .build();
    }


    // Entity -> DTO
    public static CaregiverAvailabilityDto entityToDto(
            CaregiverAvailabilityEntity availability) {

        return CaregiverAvailabilityDto.builder()
                .availabilityNo(availability.getAvailabilityNo())
                .availableDate(availability.getAvailableDate())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .status(availability.getStatus())
                .build();
    }
}