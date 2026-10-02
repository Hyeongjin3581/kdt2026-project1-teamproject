package oncare_backend.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import oncare_backend.model.entity.CareRecipientEntity;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.repository.CareRecipientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CareWorkerRecommendationService {
    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    private static final double DISTANCE_WEIGHT = 70.0;
    private static final double WORKLOAD_WEIGHT = 30.0;
    private static final double DISTANCE_SCORE_LIMIT_KM = 10.0;
    private static final double WORK_COUNT_SCORE_LIMIT = 30.0;
    private static final int RECOMMENDATION_LIMIT = 3;

    private final CareRecipientRepository careRecipientRepository;
    private final EntityManager entityManager;
    private final HaversineService haversineService;

    public CareWorkerRecommendationService(
            CareRecipientRepository careRecipientRepository,
            EntityManager entityManager,
            HaversineService haversineService) {
        this.careRecipientRepository = careRecipientRepository;
        this.entityManager = entityManager;
        this.haversineService = haversineService;
    }

    @Transactional(readOnly = true)
    public List<CareWorkerRecommendation> recommendCandidates(
            Integer careRecipientNo,
            List<CareworkerEntity> candidates) {
        CareRecipientEntity recipient = careRecipientRepository.findById(careRecipientNo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "수급자를 찾을 수 없습니다."));

        if (!hasValidCoordinates(recipient.getLatitude(), recipient.getLongitude())) {
            throw new ResponseStatusException(
                                        HttpStatusCode.valueOf(422), "수급자 좌표가 등록되지 않았습니다.");
        }

        Map<Integer, CareworkerEntity> uniqueCandidates = new LinkedHashMap<>();
        if (candidates != null) {
            for (CareworkerEntity candidate : candidates) {
                if (candidate != null
                        && candidate.getCareworkerNo() != null
                        && hasValidCoordinates(candidate.getLatitude(), candidate.getLongitude())) {
                    uniqueCandidates.putIfAbsent(candidate.getCareworkerNo(), candidate);
                }
            }
        }

        if (uniqueCandidates.isEmpty()) {
            return List.of();
        }

        Map<Integer, Long> workCounts = loadRecentCompletedWorkCounts(
                new ArrayList<>(uniqueCandidates.keySet()));
        List<ScoredCandidate> ranked = new ArrayList<>();

        for (CareworkerEntity candidate : uniqueCandidates.values()) {
            double distanceKm = haversineService.distanceKm(
                    recipient.getLatitude(), recipient.getLongitude(),
                    candidate.getLatitude(), candidate.getLongitude());
            long workCount = workCounts.getOrDefault(candidate.getCareworkerNo(), 0L);
            double distanceScore = DISTANCE_WEIGHT
                    * Math.max(0.0, 1.0 - distanceKm / DISTANCE_SCORE_LIMIT_KM);
            double workloadScore = WORKLOAD_WEIGHT
                    * Math.max(0.0, 1.0 - workCount / WORK_COUNT_SCORE_LIMIT);

            ranked.add(new ScoredCandidate(
                    candidate, distanceKm, workCount,
                    distanceScore, workloadScore, distanceScore + workloadScore));
        }

                ranked.sort((left, right) -> {
                        int order = Double.compare(right.totalScore(), left.totalScore());
                        if (order != 0) {
                                return order;
                        }
                        order = Double.compare(left.distanceKm(), right.distanceKm());
                        if (order != 0) {
                                return order;
                        }
                        order = Long.compare(left.workCount(), right.workCount());
                        if (order != 0) {
                                return order;
                        }
                        return Integer.compare(
                                        left.careworker().getCareworkerNo(),
                                        right.careworker().getCareworkerNo());
                });

                return ranked.stream()
                .limit(RECOMMENDATION_LIMIT)
                .map(candidate -> new CareWorkerRecommendation(
                        candidate.careworker().getCareworkerNo(),
                        candidate.careworker().getCareworkerName(),
                        roundToTwoDecimals(candidate.distanceKm()),
                        candidate.workCount(),
                        roundToTwoDecimals(candidate.distanceScore()),
                        roundToTwoDecimals(candidate.workloadScore()),
                        roundToTwoDecimals(candidate.totalScore())))
                .toList();
    }

    private Map<Integer, Long> loadRecentCompletedWorkCounts(List<Integer> careworkerNos) {
        LocalDate today = LocalDate.now(SEOUL_ZONE);
        LocalDate fromDate = today.minusDays(29);
        LocalDate untilDate = today.plusDays(1);
        String placeholders = java.util.stream.IntStream.range(0, careworkerNos.size())
                .mapToObj(index -> ":careworkerNo" + index)
                .collect(java.util.stream.Collectors.joining(", "));

        Query query = entityManager.createNativeQuery(
                "SELECT careworker_no, COUNT(DISTINCT request_no) "
                        + "FROM careworkersreport "
                        + "WHERE work_status = :completedStatus "
                        + "AND work_date >= :fromDate AND work_date < :untilDate "
                        + "AND careworker_no IN (" + placeholders + ") "
                        + "GROUP BY careworker_no");
        query.setParameter("completedStatus", "완료");
        query.setParameter("fromDate", fromDate);
        query.setParameter("untilDate", untilDate);
        for (int index = 0; index < careworkerNos.size(); index++) {
            query.setParameter("careworkerNo" + index, careworkerNos.get(index));
        }

        Map<Integer, Long> workCounts = new LinkedHashMap<>();
        for (Object rowValue : query.getResultList()) {
            Object[] row = (Object[]) rowValue;
            workCounts.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }
        return workCounts;
    }

    private boolean hasValidCoordinates(double latitude, double longitude) {
        return Double.isFinite(latitude)
                && Double.isFinite(longitude)
                && latitude >= -90.0 && latitude <= 90.0
                && longitude >= -180.0 && longitude <= 180.0
                && (latitude != 0.0 || longitude != 0.0);
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record ScoredCandidate(
            CareworkerEntity careworker,
            double distanceKm,
            long workCount,
            double distanceScore,
            double workloadScore,
            double totalScore) {
    }

    public record CareWorkerRecommendation(
            @JsonProperty("careworker_no") Integer careworkerNo,
            @JsonProperty("name") String name,
            @JsonProperty("distance_km") double distanceKm,
            @JsonProperty("work_count_30_days") long workCount30Days,
            @JsonProperty("distance_score") double distanceScore,
            @JsonProperty("workload_score") double workloadScore,
            @JsonProperty("total_score") double totalScore) {
    }
}