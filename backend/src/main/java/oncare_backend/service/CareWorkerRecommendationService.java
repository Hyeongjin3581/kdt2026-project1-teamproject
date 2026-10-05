package oncare_backend.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.model.entity.CareRecipientEntity;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.repository.CareRecipientRepository;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CareworkersRepository;
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
    private final CareworkersRepository careworkersRepository;
    private final HaversineService haversineService;
    private final GeoCodingService geoCodingService;

    // 점수는 거리점수 70정 + 근무점수 30점을 반환하여 최대 100점으로 산출함.
    private static final double MAX_DISTANCE_SCORE = 70.0;
    private static final double MAX_WORK_SCORE = 30.0;
    // 점수 계산은 거리산출값이 소수점으로 반환되므로 double을 사용.

    // 거리 10km부터 거리점수 0점  --> 실은 5km도 먼데.... 일단은 테스트이므로 10km로 해봄
    private static final double DISTANCE_LIMIT_KM = 10.0;

    // 최근 30일 완료 근무 20회부터 근무점수 0점   --> 초과 근무는 몸에 해로워요. 
    private static final double WORK_COUNT_LIMIT = 20.0;

    // Controller가 API 요청을 받았을 때 호출하는 Service 메서드
    //근무 중인 보호사를 조회해 추천 계산 (오늘 근무도 가능하므로 , )
    public List<CareWorkerRecommendationDto> recommendCareworkers(
            Integer careRecipientNo) {

        List<CareworkerEntity> careworkerEntities = careworkersRepository
                        .findAll()
                        .stream()
                        .filter(careworker ->"근무중"
                        .equals(careworker.getCareworkerState()))
                        .toList();

        // 후보를 조회한뒤 추천계산 메서드에 결과를 위임
        return recommendCandidates(careRecipientNo, careworkerEntities);
    }

    // [1] 석암 타이쵸우의 필수조건을 통과한 후보를 받아 점수를 계산하고 상위 3명을 반환함.
    public List<CareWorkerRecommendationDto> recommendCandidates(Integer careRecipientNo, List<CareworkerEntity> careworkerEntities) {

        // 추천 대상 수급자를 찾습니다. 번호에 해당하는 수급자가 없으면 404 오류를 반환합니다. ** 
        CareRecipientEntity recipient = careRecipientRepository.findById(careRecipientNo)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,  "수급자를 찾을 수 없습니다."));

        // 추천할 보호사가 없으면 빈 목록을 반환합니다.
        if (careworkerEntities == null || careworkerEntities.isEmpty()) {
            return List.of();
        }

        // 같은 주소를 또 만나면 지오코딩 결과를 재사용할 수 있게 저장
        Map<String, Coordinates> coordinateCache = new HashMap<>();

        // 수급자 주소를 지오코딩서비스에서 가져옴. 
        Coordinates recipientCoordinates = geocodeAddress(recipient.getCareRecipientAddress() , coordinateCache);

        // 수급자 좌표를 얻지 못하면 보호사와의 거리를 계산할 수 없습니다. **
        if (recipientCoordinates == null) {throw new ResponseStatusException( HttpStatus.UNPROCESSABLE_CONTENT,
                    "수급자 주소를 좌표로 변환할 수 없습니다. 주소를 확인해주세요.");
        }

        // 위 조건에서 참인 구문만 해당 리스트에 저장. 
        // 주소 변환이 가능한 요양보호사와 요양보호사 번호를 기준으로 좌표를 저장. 
        // 또한 보호사 번호가 중복처리 되지 않도록 기록.
        // ** List, Map, Set은 메서드 실행 중에만 사용하는 메모리 자료구조라서 휘발성 **
        List<CareworkerEntity> geocodedCareworkers = new ArrayList<>();
        Map<Integer, Coordinates> candidateCoordinates = new HashMap<>();
        Set<Integer> seenWorkerNos = new HashSet<>();

        for (CareworkerEntity worker : careworkerEntities) {
            if (worker == null || worker.getCareworkerNo() == null) continue;

            // 같은 보호사가 중복으로 들어온 경우 한 번만 처리
            if (!seenWorkerNos.add(worker.getCareworkerNo())) continue;

            // 보호자 주소 좌표로 바꾸고, 같은 주소라면 위에서 저장한 결과를 재사용
            Coordinates coordinates = geocodeAddress(
                    worker.getCareworkerAddress(),
                    coordinateCache
            );

            // 좌표로 못바꾸면 추천에서 제외
            if (coordinates == null) continue;

            geocodedCareworkers.add(worker);
            candidateCoordinates.put(worker.getCareworkerNo(), coordinates);
        }

        // 좌표값이 비엇으면 빈목록을 반환
        if (geocodedCareworkers.isEmpty()) {
            return List.of();
        }

        // [2] 수급자와 보호사의 좌표를 HaversineService에 전달해 거리를 계산
        Map<Integer, Double> distanceMap = new HashMap<>();
        for (CareworkerEntity careworker : geocodedCareworkers) {
            Coordinates workerCoordinates =
                    candidateCoordinates.get(careworker.getCareworkerNo());
            double distanceKm = haversineService.distanceKm(
                    recipientCoordinates.latitude(),
                    recipientCoordinates.longitude(),
                    workerCoordinates.latitude(),
                    workerCoordinates.longitude()
            );
            distanceMap.put(careworker.getCareworkerNo(), distanceKm);
        }

        List<Integer> workerNos = new ArrayList<>();
        for (CareworkerEntity careworker : geocodedCareworkers) {
            workerNos.add(careworker.getCareworkerNo());
        }

        // [3] 각 보호사의 최근 30일 완료 근무 횟수를 조회
        Map<Integer, Long> workCountMap = getWorkCountMap(workerNos);

        // [4] 보호사마다 거리점수를 계산
        List<CareWorkerRecommendationDto> recommendations = new ArrayList<>();
        for (CareworkerEntity worker : geocodedCareworkers) {
            double distanceKm = distanceMap.get(worker.getCareworkerNo());

            // 근무 기록이 없으면 0회로 처리
            long workCount = workCountMap.getOrDefault(
                    worker.getCareworkerNo(),
                    0L
            );

            double distanceScore = calculateDistanceScore(distanceKm);
            double workScore = calculateWorkScore(workCount);
            double totalScore = distanceScore + workScore;

            recommendations.add(new CareWorkerRecommendationDto(
                    worker.getCareworkerNo(),
                    worker.getCareworkerName(),
                    distanceKm,
                    workCount,
                    distanceScore,
                    workScore,
                    totalScore
            ));
        }

        // [5] 총점이 높은 순으로 정렬
        // 중첩 for문을 사용하여 상위 3명의 후보들을 하나씩 확인. 
        for (int i = 0; i < recommendations.size(); i++) { // 1 2 3등
            for (int j = i + 1; j < recommendations.size(); j++) { // 개별 후보들
                if (shouldComeBefore(recommendations.get(j), recommendations.get(i))) {
                    CareWorkerRecommendationDto temp = recommendations.get(i);
                    recommendations.set(i, recommendations.get(j));
                    recommendations.set(j, temp);
                }
            }
        }

        // [6] 상위 3명만 소수 둘째 자리까지 반올림 / 일단은 
        List<CareWorkerRecommendationDto> topRecommendations = new ArrayList<>();
        for (int i = 0; i < recommendations.size() && i <  3; i++) {
            CareWorkerRecommendationDto item = recommendations.get(i);
            topRecommendations.add(new CareWorkerRecommendationDto(
                    item.getCareworkerNo(),
                    item.getCareworkerName(),
                    round2(item.getDistanceKm()),
                    item.getWorkCount(),
                    round2(item.getDistanceScore()),
                    round2(item.getWorkScore()),
                    round2(item.getTotalScore())
            ));
        }

        return topRecommendations;
    }

    // [1] 주소를 GeoCodingService에 전달해 좌표를 가져옵니다.
    // 같은 주소는 캐시에서 재사용하고, 유효하지 않은 좌표 응답은 오류로 처리합니다. ** 중요한데 진짜 모르겠음. 
    // 캐시를 배운적이 있나요..? 

    // 카카오 API 호출 횟수를 줄이기 위한 것. 이 캐시는 한 번의 추천 요청 안에서 같은 주소가 반복될 때 지오코딩 API를 다시 호출하지 않고 저장된 좌표를 재사용
    private Coordinates geocodeAddress(String address, Map<String, Coordinates> coordinateCache) {

        if (address == null || address.isBlank()) return null;

        String cacheKey = address.trim().toLowerCase(Locale.ROOT);
        if (coordinateCache.containsKey(cacheKey)) {
            return coordinateCache.get(cacheKey);
        }

        List<Double> geocoding = geoCodingService.getGeoCoding(address.trim());
        if (geocoding == null) {coordinateCache.put(cacheKey, null);
            return null;
        }

        if (geocoding.size() < 2 || !hasCoordinates(geocoding.get(0), geocoding.get(1))) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "유효하지 않은 좌표");
        }

        Coordinates coordinates = new Coordinates(geocoding.get(0), geocoding.get(1));
        coordinateCache.put(cacheKey, coordinates);
        return coordinates;
    }

    // [1] 위도와 경도가 유효한 좌표 범위인지 확인
    private boolean hasCoordinates(Double latitude, Double longitude) {
        return latitude != null
                && longitude != null
                && Double.isFinite(latitude)
                && Double.isFinite(longitude)
                && latitude >= -90
                && latitude <= 90
                && longitude >= -180
                && longitude <= 180;
    }

    // [1] 위도와 경도 한 쌍
    private record Coordinates(double latitude, double longitude) {
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

    // [4] 설정한 거리(10km) 이상이면 0
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
