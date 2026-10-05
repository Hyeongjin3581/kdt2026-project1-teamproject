package oncare_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;


// 해당 내용은 추천 결과를 Controller 응답으로 전달
@AllArgsConstructor@Builder@Data
public class CareWorkerRecommendationDto {

    // DTO 생성 후 필드값 수정 x (final사용)
    private final Integer careworkerNo;
    private final String careworkerName;
    private final double distanceKm;
    private final long workCount;
    private final double distanceScore;
    private final double workScore;
    private final double totalScore;
}
