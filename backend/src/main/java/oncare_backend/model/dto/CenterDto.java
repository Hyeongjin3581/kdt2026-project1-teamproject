package oncare_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.CenterEntity;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CenterDto {
    private Integer centerNo;

    private String centerName;
    private String centerAddress;
    private String centerPhonenumber;

    public CenterEntity dtoToEntity(){
        return CenterEntity.builder()
                .centerName(centerName)
                .centerAddress(centerAddress)
                .centerPhonenumber(centerPhonenumber).build();
    }
}
