package oncare_backend.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CenterEntity;
import oncare_backend.model.entity.UserEntity;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 
@Builder 
public class CareworkerDto {
    private Integer careworkerNo;
    private String careworkerName;
    private String careworkerGender;
    private Integer hourWage;
    private Integer careworkerAge;
    private String careworkerState;
    private String careworkerAddress;

    private Integer centerNo;
    private Integer userNo;

    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    // DTO -> Entity
    public CareworkerEntity dtoToEntity(){
        return CareworkerEntity.builder()
            .careworkerNo(this.careworkerNo)
            .careworkerName(this.careworkerName)
            .careworkerGender(this.careworkerGender)
            .hourWage(this.hourWage)
            .careworkerAge(this.careworkerAge)
            .careworkerState(this.careworkerState)
            .careworkerAddress(this.careworkerAddress)
            .build();
    }

    // Entity -> DTO
    public static CareworkerDto entityToDto(CareworkerEntity careworker){
        return CareworkerDto.builder()
                .careworkerNo(careworker.getCareworkerNo())
                .careworkerName(careworker.getCareworkerName())
                .careworkerAddress(careworker.getCareworkerAddress())
                .careworkerGender(careworker.getCareworkerGender())
                .hourWage(careworker.getHourWage())
                .careworkerAge(careworker.getCareworkerAge())
                .careworkerState(careworker.getCareworkerState())
                .centerNo(careworker.getCenterEntity() == null ? null : careworker.getCenterEntity().getCenterNo())
                .userNo(careworker.getUserEntity() == null ? null : careworker.getUserEntity().getUserNo())
                .build();
    }
}
