package oncare_backend.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.model.dto.VacancyDto;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.RequestEntity;
import oncare_backend.model.repository.RequestRepository;
import oncare_backend.model.repository.VacancyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class VacancyService implements ActiveUserCheck {

    private final VacancyRepository vacancyRepository;
    private final RequestRepository requestRepository;
    private final AutoAssignService autoAssignService;
    private final CareWorkerRecommendationService careWorkerRecommendationService;

    // 방문까지 24시간 이내로 남은 결원은 긴급 결원으로 표시함.
    private static final long URGENT_HOURS = 24;


    // [1] 요양보호사가 배정을 거절하거나 확정 후 취소한 방문을 결원 목록으로 반환함.
    public List<VacancyDto> findAll(Integer centerNo) {

        // 거절 , 확정 후 취소 모두 근무기록 상태가 취소로 저장되므로 취소 기록부터 조회
        List<CareworkerReportEntity> cancelledReport = vacancyRepository.findByWorkStatus("취소");

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));

        // 같은 요청에 취소 기록이 여러 건일 수 있으므로 확인한 요청 번호를 저장
        List<Integer> checkedRequestNo = new ArrayList<>();
        List<VacancyDto> vacancy = new ArrayList<>();

        for (CareworkerReportEntity careworkerReportEntity : cancelledReport) {
            RequestEntity requestEntity = careworkerReportEntity.getRequestEntity();
            if (requestEntity == null || requestEntity.getCarerecipientEntity() == null) continue;   // 요청 , 수급자가 없으면 제외
            if (checkedRequestNo.contains(requestEntity.getRequestNo())) continue;      // 이미 확인한 요청
            checkedRequestNo.add(requestEntity.getRequestNo());

            // 이미 지난 방문은 대체자를 지정할 수 없으므로 제외
            if (requestEntity.getVisitDate() == null || requestEntity.getVisitDate().isBefore(today)) continue;

            // 탈퇴한 보호자의 방문은 대체자를 찾을 필요가 없으므로 제외
            if (!isActiveGuardian(requestEntity)) continue;

            // 이 요청의 근무기록 전체
            List<CareworkerReportEntity> report = vacancyRepository.findByRequestEntity_RequestNo(requestEntity.getRequestNo());

            // [1-1] 결원 상태 판정
            // 신청 상태 + 유효한 근무기록 (배정,확정 ,완료) 없음 → 결원
            // 배정중 상태 + 배정 근무기록 있음 → 대체요청중 ( 대체자 수락 대기 )
            // 그 외는 결원이 아니므로 null 로 두고 제외
            String vacancyState = null;

            if ("신청".equals(requestEntity.getRequestState())) {
                vacancyState = "결원";
                for (CareworkerReportEntity careworkerReportEntity2 : report) {
                    String status = careworkerReportEntity2.getWorkStatus();
                    if ("배정".equals(status) || "확정".equals(status) || "완료".equals(status)) {
                        vacancyState = null;      // 담당자가 있으므로 결원 아님
                        break;
                    }
                }
            }

            if ("배정중".equals(requestEntity.getRequestState())) {
                for (CareworkerReportEntity careworkerReportEntity2 : report) {
                    if ("배정".equals(careworkerReportEntity2.getWorkStatus())) {
                        vacancyState = "대체요청중";
                        break;
                    }
                }
            }

            if (vacancyState == null) continue;

            // [1-2] 거절/취소한 요양보호사 번호 ( 중복 확인용 ) , 이름 리스트
            List<Integer> cancelledNo = new ArrayList<>();
            List<String> cancelledName = new ArrayList<>();

            // 가장 최근에 거절/취소한 기록 ( 근무기록 번호가 가장 큰 기록 )
            CareworkerReportEntity careworkerReportEntity3 = null;

            for (CareworkerReportEntity careworkerReportEntity2 : report) {
                if (!"취소".equals(careworkerReportEntity2.getWorkStatus())) continue;
                CareworkerEntity careworkerEntity = careworkerReportEntity2.getCareworkerEntity();
                if (careworkerEntity == null) continue;

                if (!cancelledNo.contains(careworkerEntity.getCareworkerNo())) {
                    cancelledNo.add(careworkerEntity.getCareworkerNo());
                    cancelledName.add(careworkerEntity.getCareworkerName());
                }
                if (careworkerReportEntity3 == null
                        || careworkerReportEntity2.getCareworkersReportNo() > careworkerReportEntity3.getCareworkersReportNo()) {
                    careworkerReportEntity3 = careworkerReportEntity2;
                }
            }

            // 센터별 조회는 가장 최근에 거절/취소한 요양보호사의 센터를 기준으로 함. // 추후에 센터별 없애면 삭제 할 예정
            Integer centerNo2 = null;
            if (careworkerReportEntity3 != null && careworkerReportEntity3.getCareworkerEntity().getCenterEntity() != null) {
                centerNo2 = careworkerReportEntity3.getCareworkerEntity().getCenterEntity().getCenterNo();
            }

            // 센터 번호를 받았으면 해당 센터의 결원만 남김
            if (centerNo != null && !centerNo.equals(centerNo2)) continue;

            // [1-3] 방문 시작까지 남은 시간 ( 방문날짜 0시 + 시작시간 , 시간 단위 )
            int startTime = 0;
            if (requestEntity.getVisitStartTime() != null) {
                startTime = requestEntity.getVisitStartTime();
            }
            LocalDateTime visitStart = requestEntity.getVisitDate().atStartOfDay().plusHours(startTime);
            long hoursLeft = Duration.between(now, visitStart).toHours();

            // [1-4] 서비스요청 정보는 Dto에서 변환하고 , 결원 정보는 여기서 채움
            // 이름 리스트는 Dto에 넣지 않고 문자열로 넘김
            VacancyDto vacancyDto = VacancyDto.entityToDto(requestEntity);
            vacancyDto.setVacancyState(vacancyState);
            vacancyDto.setCenterNo(centerNo2);
            vacancyDto.setCancelledCareworkerName(String.join(", ", cancelledName));
            vacancyDto.setUrgent(hoursLeft <= URGENT_HOURS);
            vacancyDto.setHoursLeft(hoursLeft);

            vacancy.add(vacancyDto);
        }

        // [1-5] 정렬 ( 긴급 결원이 먼저 , 같으면 남은 시간이 적은 순 )
        for (int i = 0; i < vacancy.size(); i++) {
            for (int j = i + 1; j < vacancy.size(); j++) {
                VacancyDto vacancyDto = vacancy.get(i);
                VacancyDto vacancyDto2 = vacancy.get(j);

                // j번째가 i번째보다 앞에 와야 하는지 확인
                boolean change = false;
                if (vacancyDto2.isUrgent() != vacancyDto.isUrgent()) {
                    change = vacancyDto2.isUrgent();
                } else {
                    change = vacancyDto2.getHoursLeft() < vacancyDto.getHoursLeft();
                }

                if (change) {
                    vacancy.set(i, vacancyDto2);
                    vacancy.set(j, vacancyDto);
                }
            }
        }

        return vacancy;
    }

    // [2]결원 방문을 거절/취소한 요양보호사를 제외하고 대체 후보 상위 3명을 반환
    public List<CareWorkerRecommendationDto> vacancyDetail(Integer requestNo) {

        if (requestNo == null) {
            return List.of();
        }

        RequestEntity requestEntity = requestRepository.findById(requestNo).orElse(null);
        if (requestEntity == null || requestEntity.getCarerecipientEntity() == null) {
            return List.of();
        }

        // 배정 API 가 신청 상태만 허용하므로 신청 상태일 때만 추천
        if (!"신청".equals(requestEntity.getRequestState())) {
            return List.of();
        }

        // 해당 요청을 거절/취소한 요양보호사 번호 목록
        List<Integer> excludedNo = new ArrayList<>();
        List<CareworkerReportEntity> report = vacancyRepository.findByRequestEntity_RequestNo(requestNo);
        for (CareworkerReportEntity careworkerReportEntity : report) {
            if (!"취소".equals(careworkerReportEntity.getWorkStatus())) continue;
            if (careworkerReportEntity.getCareworkerEntity() == null) continue;
            excludedNo.add(careworkerReportEntity.getCareworkerEntity().getCareworkerNo());
        }

        // 기존 필수조건 필터 ( 근무상태 , 가입승인 , 선호성별 , 근무가능시간 , 일정중복 ) 를 통과한 요양보호사 중에서
        // 거절/취소한 요양보호사는 제외
        // 기존 필터는 취소 기록을 일정중복에서 건너뛰므로 제외하지 않으면 거절한 사람이 다시 추천됨.
        List<CareworkerEntity> candidate = new ArrayList<>();
        for (CareworkerEntity careworkerEntity : autoAssignService.filterCareworker(requestEntity)) {
            if (excludedNo.contains(careworkerEntity.getCareworkerNo())) continue;           // 거절/취소한 요양보호사
            candidate.add(careworkerEntity);
        }
        if (candidate.isEmpty()) {
            return List.of();
        }

        // 점수 계산과 상위 3명 추출은 기존 추천 메소드를 그대로 사용
        Integer careRecipientNo = requestEntity.getCarerecipientEntity().getCareRecipientNo();
        return careWorkerRecommendationService.recommendCandidates(careRecipientNo, candidate);
    }

}   // end
