package oncare_backend.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.CareworkerReviewEntity;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 
@Builder 
public class CareworkerReviewDto {
    private Integer reviewNo;
    private Integer careworkersReportNo;
    private Integer guardianNo; 

    private Integer rating;
    private String reviewContent;
    private LocalDateTime createDate;
    private LocalDateTime updateDate;
    
    // DTO -> Entity
    public CareworkerReviewEntity dtoToEntity(){
        return CareworkerReviewEntity.builder()
        .rating(this.rating)
        .reviewContent(this.reviewContent)
        .build();
    }

    // Entity -> DTO
    public static CareworkerReviewDto entityToDto(CareworkerReviewEntity careworkerReview){
        return CareworkerReviewDto.builder()
        .rating(careworkerReview.getRating())
        .reviewContent(careworkerReview.getReviewContent())
        .createDate(careworkerReview.getCreateDate())
        .updateDate(careworkerReview.getUpdateDate())
        .reviewNo(careworkerReview.getReviewNo())
        .careworkersReportNo(careworkerReview.getCareworkerReportEntity().getCareworkersReportNo())
        .guardianNo(careworkerReview.getGuardianEntity().getGuardianNo())
        .build();
    }
}
