package oncare_backend.controller;

import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.model.repository.CareworkersRepository;
import oncare_backend.service.CareWorkerRecommendationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/carerecipients")
public class CareWorkerRecommendationController {
    // 후보 보호사와 추천 점수 계산을 담당하는 서비스
    private final CareWorkerRecommendationService recommendationService;

    // 전체 보호사 목록에서 근무 중인 후보를 조회하는 Repository
    private final CareworkersRepository careworkersRepository;

    public CareWorkerRecommendationController(
            CareWorkerRecommendationService recommendationService,
            CareworkersRepository careworkersRepository) {
        this.recommendationService = recommendationService;
        this.careworkersRepository = careworkersRepository;
    }

    // 수급자 번호에 대한 요양보호사 추천 결과를 조회
    @GetMapping("/{careRecipientNo}/careworker-recommendations")
    public List<CareWorkerRecommendationDto> recommendCareworkers(
            @PathVariable Integer careRecipientNo) {
        // 근무 중인 보호사만 후보로 추려 추천 서비스에 전달
        // 거리·최근 30일 완료 근무횟수 계산과 점수순 상위 3명 선정은 추천 서비스에서 수행
        List<CareworkerEntity> candidates = careworkersRepository.findAll().stream()
                .filter(careworker -> "근무중".equals(careworker.getCareworkerState()))
                .toList();

        // 수급자 번호와 필수 조건을 통과한 후보 목록을 추천 서비스에 전달
        return recommendationService.recommendCandidates(careRecipientNo, candidates);
    }
}