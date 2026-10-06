package oncare_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;


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

// 추천 API 요청을 받아 Service에 전달하고 결과를 반환"만"함.
//  Entity/Repository를 직접 사용하지 않으며, 추천 결과를 저장하지 않아도 도미.
