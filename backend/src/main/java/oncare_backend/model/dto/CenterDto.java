package oncare_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.CenterEntity;

import java.util.ArrayList;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CenterDto {
    private Integer centerNo;

    private String centerName;
    private String centerAddress;
    private String centerPhonenumber;

    /*@Builder.Default
    private List<CareworkersDto> careworkers = new ArrayList<>();*/


    public CenterEntity dtoToEntity(){
        return CenterEntity.builder()
                .centerName(centerName)
                .centerAddress(centerAddress)
                .centerPhonenumber(centerPhonenumber).build();
    }

    public static CenterDto entityToDto(CenterEntity center){
        return CenterDto.builder()
                .centerNo(center.getCenterNo())
                .centerAddress(center.getCenterAddress())
                .centerName(center.getCenterName())
                .centerPhonenumber(center.getCenterPhonenumber()).build();
    }
}
