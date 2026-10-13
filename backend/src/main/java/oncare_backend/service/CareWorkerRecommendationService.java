package oncare_backend.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.model.entity.CareRecipientEntity;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.RequestEntity;
import oncare_backend.model.repository.CareRecipientRepository;
import oncare_backend.model.repository.CareWorkerReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CareWorkerRecommendationService {

    private final CareRecipientRepository careRecipientRepository;
    private final CareWorkerReportRepository careWorkerReportRepository;
    private final HaversineService haversineService;

    // 점수는 거리점수 50점 + 근무점수 30점 + 연속 요양 점수 20점을 더해 최대 100점으로 산출함.
    private static final double MAX_DISTANCE_SCORE = 50.0;
    private static final double MAX_WORK_SCORE = 30.0;
    private static final double MAX_CONTINUITY_SCORE = 20.0;        // 같은 수급자 연속 요양 점수 최대 20점
    // 점수 계산은 거리산출값이 소수점으로 반환되므로 double을 사용.

    // 거리 25km부터 거리점수 0점
    private static final double DISTANCE_LIMIT_KM = 25.0;

    // 최근 30일 완료 근무 20회부터 근무점수 0점   --> 초과 근무는 몸에 해로워요.
    private static final double WORK_COUNT_LIMIT = 20.0;

    // 같은 수급자를 요양한 횟수 1회당 5점 ( 1회 0점 , 2회 5점 , 3회 10점 , 4회 15점 , 5회 이상 20점 )
    private static final double CONTINUITY_SCORE_PER_COUNT = 5.0;


    // [1] 석암 타이쵸우의 필수조건을 통과한 후보를 받아 점수를 계산하고 상위 3명을 반환함.
    public List<CareWorkerRecommendationDto> recommendCandidates(Integer careRecipientNo, List<CareworkerEntity> careworkerEntities) {

        // 추천 대상 수급자를 찾습니다. 번호에 해당하는 수급자가 없으면 404 오류를 반환합니다. **
        CareRecipientEntity recipient = careRecipientRepository.findById(careRecipientNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,  "수급자를 찾을 수 없습니다."));

        // 추천할 보호사가 없으면 빈 목록을 반환합니다.
        if (careworkerEntities == null || careworkerEntities.isEmpty()) {
            return List.of();
        }

        // 수급자 좌표는 저장할 때 DB에 넣어 둔 값을 사용 (좌표를 못 구했으면 0,0)
        double recipientLat = recipient.getLatitude();
        double recipientLng = recipient.getLongitude();
        if (recipientLat == 0.0 && recipientLng == 0.0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "수급자 좌표가 없습니다. 주소를 다시 저장해주세요.");
        }

        // 좌표가 있고 중복되지 않은 보호사만 남김
        List<CareworkerEntity> targets = new ArrayList<>();
        Set<Integer> seenWorkerNos = new HashSet<>();
        for (CareworkerEntity worker : careworkerEntities) {
            if (worker == null || worker.getCareworkerNo() == null) continue;
            if (!seenWorkerNos.add(worker.getCareworkerNo())) continue;           // 중복 제거
            if (worker.getLatitude() == 0.0 && worker.getLongitude() == 0.0) continue; // 좌표 없으면 제외
            targets.add(worker);
        }
        if (targets.isEmpty()) {
            return List.of();
        }

        // [3] 각 보호사의 최근 30일 완료 근무 횟수를 조회
        List<Integer> workerNos = new ArrayList<>();
        for (CareworkerEntity worker : targets) {
            workerNos.add(worker.getCareworkerNo());
        }
        Map<Integer, Long> workCountMap = getWorkCountMap(workerNos);

        // [3-1] 각 보호사가 이 수급자를 요양한 횟수를 조회
        Map<Integer, Long> continuityCountMap = getContinuityCountMap(careRecipientNo, workerNos);

        // [4] 보호사마다 거리와 점수를 계산
        List<CareWorkerRecommendationDto> recommendations = new ArrayList<>();
        for (CareworkerEntity worker : targets) {
            double distanceKm = haversineService.distanceKm(recipientLat, recipientLng, worker.getLatitude(), worker.getLongitude());

            // 근무 기록이 없으면 0회로 처리
            long workCount = workCountMap.getOrDefault(worker.getCareworkerNo(), 0L);

            double distanceScore = calculateDistanceScore(distanceKm);
            double workScore = calculateWorkScore(workCount);

            // [4-1] 같은 수급자 연속 요양 점수 ( 기록이 없으면 0회 )
            long continuityCount = continuityCountMap.getOrDefault(worker.getCareworkerNo(), 0L);
            double continuityScore = calculateContinuityScore(continuityCount);

            recommendations.add(new CareWorkerRecommendationDto(
                    worker.getCareworkerNo(),
                    worker.getCareworkerName(),
                    distanceKm,
                    workCount,
                    distanceScore,
                    workScore,
                    continuityCount,
                    continuityScore,
                    distanceScore + workScore + continuityScore
            ));
        }

        // [5] 총점이 높은 순으로 정렬 (동점이면 거리, 근무횟수, 번호 순)
        for (int i = 0; i < recommendations.size(); i++) {
            for (int j = i + 1; j < recommendations.size(); j++) {
                if (shouldComeBefore(recommendations.get(j), recommendations.get(i))) {
                    CareWorkerRecommendationDto temp = recommendations.get(i);
                    recommendations.set(i, recommendations.get(j));
                    recommendations.set(j, temp);
                }
            }
        }

        // [6] 상위 3명만 소수 둘째 자리까지 반올림
        List<CareWorkerRecommendationDto> topRecommendations = new ArrayList<>();
        for (int i = 0; i < recommendations.size() && i < 3; i++) {
            CareWorkerRecommendationDto item = recommendations.get(i);
            topRecommendations.add(new CareWorkerRecommendationDto(
                    item.getCareworkerNo(),
                    item.getCareworkerName(),
                    round2(item.getDistanceKm()),
                    item.getWorkCount(),
                    round2(item.getDistanceScore()),
                    round2(item.getWorkScore()),
                    item.getContinuityCount(),
                    round2(item.getContinuityScore()),
                    round2(item.getTotalScore())
            ));
        }

        return topRecommendations;
    }

    // [3] 30일 근무 조회
    // API추천 요청 때마다 그 기록 중 최근 30일치만 조회해 횟수를 계산
    private Map<Integer, Long> getWorkCountMap(List<Integer> workerNos) {
        // 날짜 범위 지정 오늘을 포함한 30일 경계
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        LocalDate startDate = today.minusDays(29);
        LocalDate endDate = today.plusDays(1);

        List<CareWorkerReportRepository.WorkCount> counts =
                careWorkerReportRepository.countCompletedWork(
                        workerNos,
                        startDate,
                        endDate
                );

        Map<Integer, Long> workCountMap = new HashMap<>();
        for (CareWorkerReportRepository.WorkCount count : counts) {
            //조회한 결과는 이 메서드 안에서 보호사 번호별로 정리
            workCountMap.put(count.getCareworkerNo(), count.getWorkCount());
        }

        return workCountMap;
    }

    // [3-1] 같은 수급자 요양 횟수 조회
    // 요양보호사 번호로 근무기록 전체를 조회해서 , 이 수급자의 완료 근무만 셈
    // 같은 요청의 완료 기록이 중복되어도 1회로 셈 ( 30일 근무 횟수와 같은 기준 )
    private Map<Integer, Long> getContinuityCountMap(Integer careRecipientNo, List<Integer> careworkerNo) {

        Map<Integer, Long> continuityCountMap = new HashMap<>();

        for (Integer careworkerNo2 : careworkerNo) {
            List<CareworkerReportEntity> report = careWorkerReportRepository.findByCareworkerEntity_CareworkerNo(careworkerNo2);

            // 이미 센 요청 번호 ( 중복 확인용 )
            List<Integer> countedRequestNo = new ArrayList<>();

            for (CareworkerReportEntity careworkerReportEntity : report) {
                if (!"완료".equals(careworkerReportEntity.getWorkStatus())) continue;          // 완료 근무만

                RequestEntity requestEntity = careworkerReportEntity.getRequestEntity();
                if (requestEntity == null || requestEntity.getCarerecipientEntity() == null) continue;
                if (!careRecipientNo.equals(requestEntity.getCarerecipientEntity().getCareRecipientNo())) continue;  // 다른 수급자
                if (countedRequestNo.contains(requestEntity.getRequestNo())) continue;           // 이미 센 요청

                countedRequestNo.add(requestEntity.getRequestNo());
            }

            continuityCountMap.put(careworkerNo2, (long) countedRequestNo.size());
        }

        return continuityCountMap;
    }

    // [4] 설정한 거리(25km) 이상이면 0
    private double calculateDistanceScore(double distanceKm) {
        double remainingRatio =
                Math.max(0.0, 1.0 - distanceKm / DISTANCE_LIMIT_KM);
        return MAX_DISTANCE_SCORE * remainingRatio;
    }

    // [4] 설정한 횟수 이상(20일)이면 0점
    private double calculateWorkScore(long workCount) {
        double remainingRatio =
                Math.max(0.0, 1.0 - workCount / WORK_COUNT_LIMIT);
        return MAX_WORK_SCORE * remainingRatio;
    }

    // [4-1] 같은 수급자 연속 요양 점수 ( 1회 이하 0점 , 2회부터 1회당 5점 , 최대 20점 )
    private double calculateContinuityScore(long continuityCount) {
        if (continuityCount <= 1) {
            return 0.0;
        }
        double continuityScore = (continuityCount - 1) * CONTINUITY_SCORE_PER_COUNT;
        if (continuityScore > MAX_CONTINUITY_SCORE) {
            continuityScore = MAX_CONTINUITY_SCORE;
        }
        return continuityScore;
    }

    // [5] 총점비교
    private boolean shouldComeBefore(
            CareWorkerRecommendationDto first,
            CareWorkerRecommendationDto second) {
        if (first.getTotalScore() != second.getTotalScore()) {
            return first.getTotalScore() > second.getTotalScore();
        }
        if (first.getDistanceKm() != second.getDistanceKm()) {
            return first.getDistanceKm() < second.getDistanceKm();
        }
        if (first.getWorkCount() != second.getWorkCount()) {
            return first.getWorkCount() < second.getWorkCount();
        }
        return first.getCareworkerNo() < second.getCareworkerNo();
    }

    // [6] 소수 둘째 자리까지 반올림 / 일단 소수점 반올림 후 , 추후에 필요없으면 리액트에서 소수점 제거.
    private double round2(double number) {
        return Math.round(number * 100.0) / 100.0;
    }

}   // end

