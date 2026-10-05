package oncare_backend.service;


import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.repository.CareRecipientRepository;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CareworkersRepository;

@Service
@Transactional(readOnly = true) // 읽기 전용
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

     // 거리 10km부터 거리 점수 0점  --> 실은 5km도 먼데.... 일단은 테스트이므로 10km로 해봄
    private static final double DISTANCE_LIMIT_KM = 10.0;

    // 최근 30일 완료 근무 20회부터 근무 점수 0점   --> 초과 근무는 몸에 해로워요. 
    private static final double WORK_COUNT_LIMIT = 20.0;


    // Controller가 API 요청을 받았을 때 호출하는 Service 메서드
    public List<CareWorkerRecommendationDto> recommendCareworkers(
            Integer careRecipientNo) {

        List<CareworkerEntity> careworkerEntities = careworkersRepository.findAll().stream().filter(careworker ->
                        "근무중".equals(careworker.getCareworkerState()))
                        .toList();
        // 후보를 조회한 뒤 추천 계산 메서드에 결과를 위임
        return recommendCandidates(careRecipientNo, careworkerEntities);
    }

    // [1] 석암 타이쵸우의 필수조건을 통과하면 점수를 계산.  + 상위 3명만 반환함.
    public List<CareWorkerRecommendationDto> 




} // CareWorkerRecommendationService end