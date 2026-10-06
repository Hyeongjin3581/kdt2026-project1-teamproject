package oncare_backend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.model.entity.CaregiverAvailabilityEntity;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.RequestEntity;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CaregiverAvailabilityRepository;
import oncare_backend.model.repository.CareworkersRepository;
import oncare_backend.model.repository.RequestRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class AutoAssignService {
    private final RequestRepository requestRepository;
    private final CareworkersRepository careworkersRepository;
    private final CaregiverAvailabilityRepository caregiverAvailabilityRepository;
    private final CareWorkerReportRepository careWorkerReportRepository;
    private final CareWorkerRecommendationService careWorkerRecommendationService;

    // 상위 3명 추출 메소드
    // 필수 조건 후보를 추천 서비스에 전달하고 상위 3명을 반환
    public List<CareWorkerRecommendationDto> top3Careworkers(Integer requestNo) {
        RequestEntity requestEntity = requestRepository.findById(requestNo).orElse(null);
        if (requestEntity == null) {
            return List.of();
        }
        // 필수 조건 필터 메소드에서 근무 상태, 선호 성별, 근무 가능 날짜·시간, 일정 중복 여부를 확인한 요양보호사 후보 목록을 가져옴
        List<CareworkerEntity> careworkerEntity = filterCareworker(requestEntity);
        if (careworkerEntity.isEmpty()) {
            return List.of();
        }
        // recommendCandidates에 인자로 전달하고, 추천 결과 목록을 반환
        Integer careRecipientNo = requestEntity.getCarerecipientEntity().getCareRecipientNo();
        return careWorkerRecommendationService.recommendCandidates(careRecipientNo, careworkerEntity);
    }

    // 필수 조건 필터 메소드
    private List<CareworkerEntity> filterCareworker(RequestEntity requestEntity){
        List<CareworkerEntity> all = careworkersRepository.findAll();

        // 근무중인 상태 요양 보호사 필터링
        List<CareworkerEntity> workingList = all.stream().filter(careworkerEntity ->
            careworkerEntity.getCareworkerState().equals("근무중")).toList();

        // 선호 성별
        String preferredGender = requestEntity.getPreferredGender();

        // 선호 성별이 "무관"이거나 선호 성별과 같은 요양보호사 성별을 필터링
        List<CareworkerEntity> genderMatched = workingList.stream().filter(careworkerEntity -> preferredGender.equals("무관") ||
                careworkerEntity.getCareworkerGender().equals(preferredGender)).toList();

        // 근무 가능 시간 테이블에서 근무가능요일 + 근무가능시간 + 근무상태 비교해서 true인 값만 필터링
        List<CareworkerEntity> availabilityList = genderMatched.stream()
                .filter(careworkerEntity -> canWork(careworkerEntity, requestEntity))
                .toList();

        // 근무 기록 테이블에서 상태가 취소인거 빼고 예정된 일을 찾아서 필터링
        List<CareworkerEntity> list = availabilityList.stream()
                .filter(careworkerEntity -> isFree(careworkerEntity, requestEntity))
                .toList();

        return list;
    }

    // 근무 가능 시간 비교
    private boolean canWork(CareworkerEntity cw, RequestEntity request) {
        // 양방향으로 안만들어서 리포지토리에 JPA추가
        // 받은 요양 보호사의 요청에 들어있는 방문 날짜에 해당하는 행들을 반환
        List<CaregiverAvailabilityEntity> date = caregiverAvailabilityRepository.findByCareworkerEntityAndAvailableDate(cw, request.getVisitDate());
        for (CaregiverAvailabilityEntity availability : date) {
            if (!availability.getStatus().equals("근무가능")){
                continue;
            }
            if (request.getVisitStartTime() >= availability.getStartTime() && request.getVisitEndTime() <= availability.getEndTime()){
                return true;
            }
        }
        return false;
    }

    // 근무 기록 비교
    private boolean isFree(CareworkerEntity cw, RequestEntity request) {
        // 근무 기록에서 요청한 day랑 비교해서 근무기록 테이블에서 행 가져오기
        List<CareworkerReportEntity> date = careWorkerReportRepository.findByCareworkerEntityAndWorkDate(cw, request.getVisitDate());
        for (CareworkerReportEntity report : date) {
            // 취소된 일정은 시간을 차지하지 않으므로 건너뜀
            if (report.getWorkStatus().equals("취소")){
                continue;
            }
            // 만약 근무 기록에 예정,배정
            if (request.getVisitStartTime() < report.getWorkEndTime() && request.getVisitEndTime() > report.getWorkStartTime()){
                return false;
            }
        }
        return true;
    }
}
