package oncare_backend.model.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.RequestEntity;

@NoArgsConstructor
@AllArgsConstructor 
@Data 
@Builder 
public class RequestDto {
    private Integer requestNo;
    private String preferredGender;
    private String requestState;
    private LocalDate visitDate;
    private LocalTime visitStartTime;
    private LocalTime visitEndTime;
    private String requestContent;

    //FK
    @Builder.Default
    private Integer carerecipientNo = null;

    public RequestEntity dtoToEntity(){
        return RequestEntity.builder()
                            .preferredGender(this.preferredGender)
                            .requestState(this.requestState)
                            .visitDate(this.visitDate)
                            .visitStartTime(this.visitStartTime)
                            .visitEndTime(this.visitEndTime)
                            .requestContent(this.requestContent)
                            .build();
    }

    public static RequestDto entityToDto(RequestEntity entity){
        return RequestDto.builder()
                        .requestNo(entity.getRequestNo())
                        .preferredGender(entity.getPreferredGender())
                        .requestState(entity.getRequestState())
                        .visitDate(entity.getVisitDate())
                        .visitStartTime(entity.getVisitStartTime())
                        .visitEndTime(entity.getVisitEndTime())
                        .requestContent(entity.getRequestContent())
                        .build();
    }
}
