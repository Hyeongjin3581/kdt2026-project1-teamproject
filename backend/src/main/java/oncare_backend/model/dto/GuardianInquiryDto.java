package oncare_backend.model.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.GuardianInquiryEntity;

@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class GuardianInquiryDto {
    private Integer inquiry_no;
    private Integer guardian_no;
    private Integer inquiry_category_no;
    private LocalDate wish_date;
    private LocalTime wish_start_time;
    private LocalTime wish_end_time;
    private String inquiry_content;

    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    public GuardianInquiryEntity toEntity(){
        return GuardianInquiryEntity.builder()
        .guardian_no(this.guardian_no)
        .inquiry_category_no(this.inquiry_category_no)
        .wish_date(this.wish_date)
        .wish_start_time(this.wish_start_time)
        .wish_end_time(this.wish_end_time)
        .inquiry_content(this.inquiry_content)
        .build();
    }

    public static GuardianInquiryDto from(GuardianInquiryEntity entity){
       return GuardianInquiryDto.builder()
       .inquiry_no(entity.getInquiry_no())
       .guardian_no(entity.getGuardian_no())
       .inquiry_category_no(entity.getInquiry_category_no())
       .wish_date(entity.getWish_date())
       .wish_start_time(entity.getWish_start_time())
       .wish_end_time(entity.getWish_end_time())
       .inquiry_content(entity.getInquiry_content())
       .createDate(entity.getCreateDate())
       .updateDate(entity.getUpdateDate())
       .build();
    }
}
