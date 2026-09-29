package oncare_backend.model.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.RequestEntity;

@NoArgsConstructor
@AllArgsConstructor 
@Getter @Setter @ToString 
@Builder 
public class CareworkerReportDto {

    private Integer careworkersReportNo;

    //FK
    @Builder.Default
    private Integer careworkerNo = null;
    //FK
    @Builder.Default
    private Integer requestNo = null;

    private LocalDate workDate;
    private Integer workStartTime;
    private Integer workEndTime;
    private String workStatus;

    public CareworkerReportEntity dtoToEntity(){
        return CareworkerReportEntity.builder()
                                    .workDate(this.workDate)
                                    .workStartTime(this.workStartTime)
                                    .workEndTime(this.workEndTime)
                                    .workStatus(workStatus)
                                        .careworkerEntity(this.careworkerNo == null ? null : CareworkerEntity.builder()
                                            .careworkerNo(this.careworkerNo)
                                            .build())
                                        .requestEntity(this.requestNo == null ? null : RequestEntity.builder()
                                            .requestNo(this.requestNo)
                                            .build())
                                    .build();
    }

    public static CareworkerReportDto entityToDto(CareworkerReportEntity entity){
        return CareworkerReportDto.builder()
                                    .careworkersReportNo(entity.getCareworkersReportNo())
                                        .careworkerNo(entity.getCareworkerEntity() == null
                                            ? null : entity.getCareworkerEntity().getCareworkerNo())
                                        .requestNo(entity.getRequestEntity() == null
                                            ? null : entity.getRequestEntity().getRequestNo())
                                    .workDate(entity.getWorkDate())
                                    .workStartTime(entity.getWorkStartTime())
                                    .workEndTime(entity.getWorkEndTime())
                                    .workStatus(entity.getWorkStatus())
                                    .build();
    }
}
