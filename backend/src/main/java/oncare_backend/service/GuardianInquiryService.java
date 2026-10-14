package oncare_backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.model.dto.GuardianInquiryAnswerDto;
import oncare_backend.model.dto.GuardianInquiryDto;
import oncare_backend.model.dto.InquiryScheduleOptionDto;
import oncare_backend.model.entity.CareRecipientEntity;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.entity.GuardianInquiryEntity;
import oncare_backend.model.entity.InquiryCategoryEntity;
import oncare_backend.model.entity.RequestEntity;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CareWorkerRepository;
import oncare_backend.model.repository.GuardianInquiryRepository;
import oncare_backend.model.repository.GuardianRepository;
import oncare_backend.model.repository.InquiryCategoryRepository;
import oncare_backend.model.repository.RequestRepository;

@Service
public class GuardianInquiryService {

	// 문의 카테고리 1번 = 방문 시간 변경 요청 (2번 방문 요일 변경 요청은 1번으로 통합됨)
	private static final Integer SCHEDULE_CATEGORY_NO = 1;

    @Autowired
	private GuardianInquiryRepository guardianInquiryRepository;

	@Autowired
	private GuardianRepository guardianRepository;

	@Autowired
	private InquiryCategoryRepository inquiryCategoryRepository;

	@Autowired
	private RequestRepository requestRepository;

	@Autowired
	private CareWorkerRepository careWorkerRepository;

	@Autowired
	private CareWorkerReportRepository careWorkerReportRepository;

	@Autowired
	private AutoAssignService autoAssignService;

	@Autowired
	private CareWorkerRecommendationService careWorkerRecommendationService;

	// 1. 보호자 문의 생성
	@Transactional
	public boolean GuardianInquiryCreate(GuardianInquiryDto guardianInquiryDto) {
		if (guardianInquiryDto.getGuardianNo() == null || guardianInquiryDto.getInquiryCategoryNo() == null) {
			return false;
		}
		Optional<GuardianEntity> guardianOptional = guardianRepository
				.findById(guardianInquiryDto.getGuardianNo());
		Optional<InquiryCategoryEntity> categoryOptional = inquiryCategoryRepository
				.findById(guardianInquiryDto.getInquiryCategoryNo());
		if (guardianOptional.isEmpty() || categoryOptional.isEmpty()) { return false; }

		GuardianInquiryEntity guardianInquiryEntity = guardianInquiryDto.dtoToEntity();

		guardianInquiryEntity.setGuardianEntity(guardianOptional.get());
		guardianInquiryEntity.setInquiryCategoryEntity(categoryOptional.get());

		// 문의 대상 방문 연결 : 번호가 왔으면 실제로 있고, 이 보호자의 수급자 요청이어야 함
		if (guardianInquiryDto.getRequestNo() != null) {
			RequestEntity requestEntity = requestRepository.findById(guardianInquiryDto.getRequestNo()).orElse(null);
			if (requestEntity == null) return false;
			if (!isGuardiansRequest(requestEntity, guardianInquiryDto.getGuardianNo())) return false;
			guardianInquiryEntity.setRequestEntity(requestEntity);
		}

		GuardianInquiryEntity savedEntity = guardianInquiryRepository.save(guardianInquiryEntity);
		if (savedEntity.getInquiryNo() >= 1) { return true; }
		return false;
	}

	// 2. 보호자 문의 수정
	@Transactional
	public boolean GuardianInquiryModify(GuardianInquiryDto guardianInquiryDto) {
		if (guardianInquiryDto.getInquiryNo() == null
				|| guardianInquiryDto.getGuardianNo() == null
				|| guardianInquiryDto.getInquiryCategoryNo() == null) {
			return false;
		}
		Optional<GuardianInquiryEntity> inquiryOptional = guardianInquiryRepository
				.findById(guardianInquiryDto.getInquiryNo());
		Optional<GuardianEntity> guardianOptional = guardianRepository
				.findById(guardianInquiryDto.getGuardianNo());
		Optional<InquiryCategoryEntity> categoryOptional = inquiryCategoryRepository
				.findById(guardianInquiryDto.getInquiryCategoryNo());
		if (inquiryOptional.isEmpty() || guardianOptional.isEmpty() || categoryOptional.isEmpty()) {
			return false;
		}

		GuardianInquiryEntity guardianInquiryEntity = inquiryOptional.get();
		// 관리자가 응답한 문의는 보호자가 수정할 수 없음 (답변한 질문 내용이 바뀌는 것 방지)
		if (guardianInquiryEntity.getAnswerContent() != null) return false;

		guardianInquiryEntity.setGuardianEntity(guardianOptional.get());
		guardianInquiryEntity.setInquiryCategoryEntity(categoryOptional.get());
		guardianInquiryEntity.setWishDate(guardianInquiryDto.getWishDate());
		guardianInquiryEntity.setWishStartTime(guardianInquiryDto.getWishStartTime());
		guardianInquiryEntity.setWishEndTime(guardianInquiryDto.getWishEndTime());
		guardianInquiryEntity.setInquiryContent(guardianInquiryDto.getInquiryContent());
		guardianInquiryRepository.save(guardianInquiryEntity);
		return true;
	}

	// 3. 보호자 문의 삭제 (관리자 화면도 같은 API 를 쓰므로 응답 완료 잠금은 보호자 화면(프론트)에서 건다)
	@Transactional
	public boolean GuardianInquiryDelete(Integer inquiryNo) {
		if (inquiryNo == null) {
			return false;
		}
		Optional<GuardianInquiryEntity> optional = guardianInquiryRepository
				.findById(inquiryNo);
		if (optional.isPresent()) {
			guardianInquiryRepository.delete(optional.get());
			return true;
		}
		return false;
	}

	// 4. 보호자 문의 전체 조회(관리자)
	@Transactional(readOnly = true)
	public List<GuardianInquiryDto>GuardianInquiryFindAll() {
		return guardianInquiryRepository.findAll().stream()
				.map(GuardianInquiryDto::entityToDto)
				.toList();
	}

	// 5. 문의 응답 팝업 : 기존 근무자 + 희망 시간 기준 추천 3명
	//    방문 시간 변경 문의가 아니거나, 방문 연결·희망 일정이 없으면 null
	@Transactional(readOnly = true)
	public InquiryScheduleOptionDto GuardianInquiryScheduleOptions(Integer inquiryNo) {
		if (inquiryNo == null) return null;
		GuardianInquiryEntity inquiry = guardianInquiryRepository.findById(inquiryNo).orElse(null);
		if (inquiry == null || !isScheduleInquiry(inquiry)) return null;

		RequestEntity request = inquiry.getRequestEntity();
		RequestEntity wish = toWishRequest(inquiry);
		CareworkerReportEntity current = activeReport(request.getRequestNo());
		CareworkerEntity currentCw = current == null ? null : current.getCareworkerEntity();

		// 추천 후보 : 희망 시간 기준 필수조건 통과자 중 기존 근무자는 따로 보여 주므로 제외
		List<CareworkerEntity> passed = autoAssignService.filterCareworker(wish, request.getRequestNo()).stream()
				.filter(cw -> currentCw == null || !cw.getCareworkerNo().equals(currentCw.getCareworkerNo()))
				.toList();
		// 수급자 좌표가 없으면 추천 없이 기존 근무자만 보여 준다
		// 추천 메소드가 던지는 422 예외를 여기서 catch 하면 트랜잭션이 롤백 표시되어 500 이 나므로 , 호출 전에 좌표를 먼저 확인
		List<CareWorkerRecommendationDto> top3 = List.of();
		CareRecipientEntity careRecipientEntity = request.getCarerecipientEntity();
		if (careRecipientEntity.getLatitude() != 0.0 || careRecipientEntity.getLongitude() != 0.0) {
			top3 = careWorkerRecommendationService
					.recommendCandidates(careRecipientEntity.getCareRecipientNo(), passed);
		}

		return InquiryScheduleOptionDto.builder()
				.currentCareworkerNo(currentCw == null ? null : currentCw.getCareworkerNo())
				.currentCareworkerName(currentCw == null ? null : currentCw.getCareworkerName())
				.currentWorkStatus(current == null ? null : current.getWorkStatus())
				.currentAvailable(currentCw != null && autoAssignService.isAvailable(currentCw, wish, request.getRequestNo()))
				.candidates(top3)
				.build();
	}

	// 6. 문의 응답 · 응답 수정 (applySchedule = true 면 배정 변경까지 한 트랜잭션으로)
	@Transactional
	public boolean GuardianInquiryAnswer(GuardianInquiryAnswerDto dto) {
		if (dto.getInquiryNo() == null || dto.getAnswerContent() == null || dto.getAnswerContent().isBlank()) return false;
		GuardianInquiryEntity inquiry = guardianInquiryRepository.findById(dto.getInquiryNo()).orElse(null);
		if (inquiry == null) return false;

		// 배정 변경이 실패하면 응답도 저장하지 않는다 (false 반환 → 아래 코드 실행 안 됨)
		boolean applied = Boolean.TRUE.equals(dto.getApplySchedule());
		if (applied && !applySchedule(inquiry, dto.getCareworkerNo())) return false;

		LocalDateTime now = LocalDateTime.now();
		inquiry.setAnswerContent(dto.getAnswerContent().trim());
		inquiry.setAnswerDate(now);
		// 배정 변경 시각은 실제로 배정을 바꿨을 때만 기록 (응답 메시지만 수정할 때는 그대로)
		if (applied) inquiry.setScheduleAppliedDate(now);
		return true; // @Transactional 더티체킹으로 자동 저장
	}

	// ------------------------------------------------------------ 내부용

	// 방문 시간 변경 문의 + 방문 연결 + 희망 일정이 모두 있는지
	private boolean isScheduleInquiry(GuardianInquiryEntity inquiry) {
		return SCHEDULE_CATEGORY_NO.equals(inquiry.getInquiryCategoryEntity().getInquiryCategoryNo())
				&& inquiry.getRequestEntity() != null
				&& inquiry.getWishDate() != null
				&& inquiry.getWishStartTime() != null
				&& inquiry.getWishEndTime() != null;
	}

	// 요청이 이 보호자의 수급자 것인지
	private boolean isGuardiansRequest(RequestEntity request, Integer guardianNo) {
		return request.getCarerecipientEntity() != null
				&& request.getCarerecipientEntity().getGuardianEntity() != null
				&& guardianNo.equals(request.getCarerecipientEntity().getGuardianEntity().getGuardianNo());
	}

	// 희망 일정으로 바꾼 임시 요청 : save() 하지 않으므로 DB 에 반영되지 않는다 (필터·근무가능 판단용)
	private RequestEntity toWishRequest(GuardianInquiryEntity inquiry) {
		RequestEntity request = inquiry.getRequestEntity();
		return RequestEntity.builder()
				.preferredGender(request.getPreferredGender())
				.visitDate(inquiry.getWishDate())
				.visitStartTime(inquiry.getWishStartTime())
				.visitEndTime(inquiry.getWishEndTime())
				.carerecipientEntity(request.getCarerecipientEntity())
				.build();
	}

	// 현재 유효한 근무기록 (배정 = 수락 대기 / 확정 = 수락 완료)
	private CareworkerReportEntity activeReport(Integer requestNo) {
		return careWorkerReportRepository.findByRequestEntity_RequestNo(requestNo).stream()
				.filter(r -> "배정".equals(r.getWorkStatus()) || "확정".equals(r.getWorkStatus()))
				.findFirst().orElse(null);
	}

	// 배정 변경 : 요청 시간을 희망 일정으로 옮기고 담당자를 정한다
	private boolean applySchedule(GuardianInquiryEntity inquiry, Integer careworkerNo) {
		if (!isScheduleInquiry(inquiry)) return false;
		RequestEntity request = inquiry.getRequestEntity();
		if ("완료".equals(request.getRequestState()) || "취소".equals(request.getRequestState())) return false;
		CareworkerReportEntity current = activeReport(request.getRequestNo());

		// (1) 담당자를 고르지 않음 : 기존 담당자가 없을 때만 허용 → 시간만 바꾸고 '신청' 유지
		if (careworkerNo == null) {
			if (current != null) return false;
			moveToWish(request, inquiry);
			return true;
		}

		// 화면에서 막더라도 서버에서 한 번 더 근무 가능 여부 확인 (팝업을 연 뒤 다른 배정이 생겼을 수 있음)
		CareworkerEntity worker = careWorkerRepository.findById(careworkerNo).orElse(null);
		if (worker == null || !autoAssignService.isAvailable(worker, toWishRequest(inquiry), request.getRequestNo())) return false;

		moveToWish(request, inquiry);
		if (current != null && current.getCareworkerEntity().getCareworkerNo().equals(careworkerNo)) {
			// (2) 기존 근무자 유지 : 근무기록 날짜·시간만 변경, 상태(배정/확정)와 요청 상태는 그대로
			current.setWorkDate(inquiry.getWishDate());
			current.setWorkStartTime(inquiry.getWishStartTime());
			current.setWorkEndTime(inquiry.getWishEndTime());
		} else if (current != null) {
			// (3) 다른 요양보호사로 교체 : 기존 근무기록을 새 담당자로 바꿔 쓴다
			//     - '취소'로 바꾸면 결원 관리에 잘못 표시되고
			//     - 삭제하면 서버 재시작 때 oncare.sql 의 INSERT IGNORE 가 같은 번호의 샘플 행을 되살린다
			current.setCareworkerEntity(worker);
			current.setWorkStatus("배정");                // 새 요양보호사의 수락 대기
			current.setWorkDate(inquiry.getWishDate());
			current.setWorkStartTime(inquiry.getWishStartTime());
			current.setWorkEndTime(inquiry.getWishEndTime());
			request.setRequestState("배정중");
		} else {
			// (4) 기존 담당자 없음 : 새 근무기록 생성
			CareworkerReportEntity report = new CareworkerReportEntity();
			report.setCareworkerEntity(worker);
			report.setRequestEntity(request);
			report.setWorkStatus("배정");                // 새 요양보호사의 수락 대기
			report.setWorkDate(inquiry.getWishDate());
			report.setWorkStartTime(inquiry.getWishStartTime());
			report.setWorkEndTime(inquiry.getWishEndTime());
			careWorkerReportRepository.save(report);
			request.setRequestState("배정중");
		}
		return true;
	}

	// 요청(방문) 시간을 희망 일정으로 변경
	private void moveToWish(RequestEntity request, GuardianInquiryEntity inquiry) {
		request.setVisitDate(inquiry.getWishDate());
		request.setVisitStartTime(inquiry.getWishStartTime());
		request.setVisitEndTime(inquiry.getWishEndTime());
	}
}
