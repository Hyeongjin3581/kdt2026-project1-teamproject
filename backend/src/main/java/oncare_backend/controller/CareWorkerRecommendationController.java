package oncare_backend.controller;

import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.repository.CareworkersRepository;
import oncare_backend.service.CareWorkerRecommendationService;
import oncare_backend.service.CareWorkerRecommendationService.CareWorkerRecommendation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/carerecipients")
public class CareWorkerRecommendationController {
    private final CareWorkerRecommendationService recommendationService;
    private final CareworkersRepository careworkersRepository;

    public CareWorkerRecommendationController(
            CareWorkerRecommendationService recommendationService,
            CareworkersRepository careworkersRepository) {
        this.recommendationService = recommendationService;
        this.careworkersRepository = careworkersRepository;
    }

    @GetMapping("/{careRecipientNo}/careworker-recommendations")
    public List<CareWorkerRecommendation> recommendCareworkers(
            @PathVariable Integer careRecipientNo) {
        List<CareworkerEntity> candidates = careworkersRepository.findAll().stream()
                .filter(careworker -> "근무중".equals(careworker.getCareworkerState()))
                .toList();

        return recommendationService.recommendCandidates(careRecipientNo, candidates);
    }
}