package oncare_backend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
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

    // 상위 3명 추출 메소드
    public List<CareworkerEntity> top3Careworkers(Integer requestNo){
        // requesNo값으로 requestEntity 찾고 없으면 빈 배열 리턴
        RequestEntity requestEntity = requestRepository.findById(requestNo).orElse(null);
        if (requestEntity == null){
            return new ArrayList<>();
        }

        // 필수 조건 필터 메소드 호출해서 배정가능한 요양보호사 받기
        List<CareworkerEntity> careworkerEntities = filterCareworker(requestEntity);




        return new ArrayList<>();
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
                .filter(careworkerEntity -> isWithinAvailability(careworkerEntity, requestEntity))
                .toList();

        availabilityList.stream()
                .filter(careworkerEntity -> hasTimeConflict(careworkerEntity,requestEntity))
                .toList();
    }

    // 근무 가능 시간 비교
    private boolean isWithinAvailability(CareworkerEntity cw, RequestEntity request) {
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
    private boolean hasTimeConflict(CareworkerEntity cw, RequestEntity request) {
        List<CareworkerReportEntity> date = careWorkerReportRepository.findByCareworkerEntityAndWorkDate(cw, request.getVisitDate());
        for (CareworkerReportEntity report : date) {
            if (report.getWorkStatus().equals("취소")){
                continue;
            }
            if (report.getWorkStartTime() )
        }


        return false;
    }
}
