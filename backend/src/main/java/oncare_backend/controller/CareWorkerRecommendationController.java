package oncare_backend.controller;

import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.service.CareWorkerRecommendationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/carerecipients")
public class CareWorkerRecommendationController {
    private final CareWorkerRecommendationService recommendationService;

    // 추천 요청을 처리할 Service를 주입
    public CareWorkerRecommendationController(CareWorkerRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    // 수급자 번호를 받아 수급자의 상위 3명 요양보호사 추천 결과를 반환
    @GetMapping("")
    public List<CareWorkerRecommendationDto> recommendCareworkers(
            @RequestParam(name = "careRecipientNo") Integer careRecipientNo) {
        return recommendationService.recommendCareworkers(careRecipientNo);
    }
}

// 추천 API 요청을 받아 Service에 전달하고 결과를 반환"만"함.
//  Entity/Repository를 직접 사용하지 않으며, 추천 결과를 저장하지 않아도 도미.