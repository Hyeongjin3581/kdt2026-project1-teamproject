package oncare_backend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.model.dto.CareworkerDto;
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
public class AutoAssignService implements ActiveUserCheck {
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
        List<CareworkerEntity> careworkerEntity = filterCareworkerForGroup(requestEntity);
        if (careworkerEntity.isEmpty()) {
            return List.of();
        }
        // recommendCandidates에 인자로 전달하고, 추천 결과 목록을 반환
        Integer careRecipientNo = requestEntity.getCarerecipientEntity().getCareRecipientNo();
        return careWorkerRecommendationService.recommendCandidates(careRecipientNo, careworkerEntity);
    }

    // 필수 조건 필터 메소드 (기존 호출부는 그대로 이 메소드 사용)
    public List<CareworkerEntity> filterCareworker(RequestEntity requestEntity){
        return filterCareworker(requestEntity, null);
    }

    // 묶음 필터 : 같은 requestGroup의 "신청"상태 날짜에 모든 요양보호사를 남김
    public List<CareworkerEntity> filterCareworkerForGroup(RequestEntity requestEntity){
        List<CareworkerEntity> today = filterCareworker(requestEntity); // 그날 갈수 있는사람
        if (requestEntity.getRequestGroup() == null){   // 묶음이 없는 신청은 그대로 반환
            return today;
        }

        // 같은 묶음 번호를 가진 신청(날짜)을 전부 가져온다
        List<RequestEntity> group = requestRepository.findByRequestGroup(requestEntity.getRequestGroup());
        List<CareworkerEntity> result = today; // result : 살아남은 후보 명단. 처음엔 그날 갈 수 있는 사람으로 시작해서 날짜마다 줄어든다

        for (RequestEntity request : group) {                // 묶음의 날짜를 하나씩 확인
            if (!"신청".equals(request.getRequestState())){   // 이미 배정중,배정완료인 날짜는 다른 사람이 맡았으니 비교하지 않고 건너뜀
                continue;
            }
            List<CareworkerEntity> ok = filterCareworker(request); // ok : 이 날짜에 갈 수 있는 요양보호사들
            List<CareworkerEntity> next = new ArrayList<>(); // next : 이 날짜까지 통과한 사람을 새로 담을 빈 목록
            for (CareworkerEntity careworkerEntity : result) {  // 후보 명단(result)에서 한 명씩 꺼내서
                boolean found = false; // found : 이 후보가 ok 명단에 있는지 표시 (처음엔 못 찾음)
                for (CareworkerEntity entity : ok) {
                    // 요양보호사 번호가 같으면 이 날짜에도 갈 수 있는 사람 (Integer 라서 equals 로 비교)
                    if (entity.getCareworkerNo().equals(careworkerEntity.getCareworkerNo())){
                        found = true;
                        break;
                        }
                    }
                if (found){
                    next.add(careworkerEntity);
                }
            }
            result = next;
        }

        if (result.isEmpty()){ // 모두 가능한 시간 없으면 그날만이라도
            return today;
        }
        return result;
    }

    // 필수 조건 필터 메소드
    // excludeRequestNo : 일정 겹침 검사에서 제외할 요청 번호
    //   → 문의 응답(방문 시간 변경)에서는 '같은 방문'의 기존 근무기록을 겹침으로 보지 않는다
    public List<CareworkerEntity> filterCareworker(RequestEntity requestEntity, Integer excludeRequestNo){
        List<CareworkerEntity> all = careworkersRepository.findAll();

        // 근무중인 상태 요양 보호사 필터링
        List<CareworkerEntity> workingList = all.stream().filter(careworkerEntity ->
            "근무중".equals(careworkerEntity.getCareworkerState())).toList();

        // 가입 승인 전(승인대기)인 요양보호사 제외 ( 로그인을 못 해서 배정을 수락할 수 없음 )
        List<CareworkerEntity> approvedList = workingList.stream().filter(careworkerEntity ->
            "승인완료".equals(careworkerEntity.getSignState())).toList();

        // 탈퇴(회원 상태 delete)한 요양보호사 제외
        List<CareworkerEntity> activeList = approvedList.stream().filter(careworkerEntity -> isActiveUser(careworkerEntity.getUserEntity())).toList();

        // 선호 성별
        String preferredGender = requestEntity.getPreferredGender();

        // 선호 성별이 "무관"(또는 비어 있음)이거나 선호 성별과 같은 요양보호사 성별을 필터링
        List<CareworkerEntity> genderMatched = activeList.stream().filter(careworkerEntity -> genderOk(careworkerEntity, preferredGender)).toList();

        // 근무 가능 시간 테이블에서 근무가능요일 + 근무가능시간 + 근무상태 비교해서 true인 값만 필터링
        List<CareworkerEntity> availabilityList = genderMatched.stream()
                .filter(careworkerEntity -> canWork(careworkerEntity, requestEntity))
                .toList();

        return availabilityList.stream()
            .filter(careworkerEntity -> !isBusy(careworkerEntity, requestEntity, excludeRequestNo))
                .toList();
    }

    // 요양보호사 1명이 (임시)요청 시간에 근무 가능한지 : 문의 응답 팝업의 '기존 근무자' 판단, 응답 저장 시 서버 재검증에 사용
    public boolean isAvailable(CareworkerEntity cw, RequestEntity request, Integer excludeRequestNo) {
        return "근무중".equals(cw.getCareworkerState())
            && "승인완료".equals(cw.getSignState())
            && isActiveUser(cw.getUserEntity())
            && genderOk(cw, request.getPreferredGender())
            && canWork(cw, request)
            && !isBusy(cw, request, excludeRequestNo);
    }

    // 선호 성별 비교 (null 이면 무관으로 처리 → 기존 preferredGender.equals() 의 NPE 방지)
    private boolean genderOk(CareworkerEntity cw, String preferredGender) {
        return preferredGender == null || preferredGender.equals("무관") || preferredGender.equals(cw.getCareworkerGender());
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
    private boolean isBusy(CareworkerEntity cw, RequestEntity request, Integer excludeRequestNo) {
        // 근무 기록에서 요청한 day랑 비교해서 근무기록 테이블에서 행 가져오기
        List<CareworkerReportEntity> date = careWorkerReportRepository.findByCareworkerEntityAndWorkDate(cw, request.getVisitDate());
        for (CareworkerReportEntity report : date) {
            if ("취소".equals(report.getWorkStatus())){
                continue;
            }
            // 같은 방문의 근무기록은 '옮길 대상'이므로 겹침으로 보지 않음
            if (excludeRequestNo != null && report.getRequestEntity() != null
                    && excludeRequestNo.equals(report.getRequestEntity().getRequestNo())) {
                continue;
            }
            if (request.getVisitStartTime() < report.getWorkEndTime()
                    && request.getVisitEndTime() > report.getWorkStartTime()) {
                return true;
            }
        }
        return false;
    }

    // filterCareworker이용해서 컨트롤러에서 받은 requestNo값으로 필수조건 필터링
    public List<CareworkerDto> filterCareworkers(Integer requestNo) {
        RequestEntity requestEntity = requestRepository.findById(requestNo).orElse(null);
        if (requestEntity == null) {
            return new ArrayList<>();
        }
        List<CareworkerEntity> careworkerEntities = filterCareworkerForGroup(requestEntity);
        if (careworkerEntities == null){
            return new ArrayList<>();
        }
        return careworkerEntities.stream().map(careworkerEntity -> CareworkerDto.entityToDto(careworkerEntity)).toList();
    }
}
