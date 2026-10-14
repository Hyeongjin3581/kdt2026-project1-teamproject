package oncare_backend.controller;

import java.util.ArrayList;
import java.util.List;

import oncare_backend.model.dto.NotifyType;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.entity.GuardianInquiryEntity;
import oncare_backend.model.repository.GuardianInquiryRepository;
import oncare_backend.model.repository.GuardianRepository;
import oncare_backend.service.AuthChecker;
import oncare_backend.service.JwtUtil;
import oncare_backend.service.NotifyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import oncare_backend.model.dto.GuardianInquiryAnswerDto;
import oncare_backend.model.dto.GuardianInquiryDto;
import oncare_backend.model.dto.InquiryScheduleOptionDto;
import oncare_backend.service.GuardianInquiryService;

@RestController 
@RequestMapping("/guardianinquiry")
public class GuardianInquiryController {

	@Autowired
	private GuardianInquiryService guardianInquiryService;
    @Autowired
    private NotifyService notifyService;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private AuthChecker authChecker;
    @Autowired
    private GuardianRepository guardianRepository;
    @Autowired
    private GuardianInquiryRepository guardianInquiryRepository;

    // 로그인한 보호자 번호 조회
    private Integer getMyGuardianNo(String accessToken) {
        if (!authChecker.hasRole(accessToken, 1)) return null;

        Integer userNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (userNo == null) return null;

        GuardianEntity guardian = guardianRepository.findByUserEntity_UserNo(userNo);
        if (guardian == null) return null;

        return guardian.getGuardianNo();
    }

    // 로그인한 보호자 본인이 작성한 문의인지 확인
    private boolean isMyInquiry(String accessToken, Integer inquiryNo) {
        Integer myGuardianNo = getMyGuardianNo(accessToken);
        if (myGuardianNo == null || inquiryNo == null) return false;

        GuardianInquiryEntity inquiry = guardianInquiryRepository.findById(inquiryNo).orElse(null);
        if (inquiry == null || inquiry.getGuardianEntity() == null) return false;

        return myGuardianNo.equals(inquiry.getGuardianEntity().getGuardianNo());
    }

	// 1. 보호자 문의 생성 --> 보호자(1) 본인 이름으로만
	@PostMapping("")
	public boolean GuardianInquiryCreate(@CookieValue(value = "accessToken", required = false)String token,
                                         @RequestBody GuardianInquiryDto guardianInquiryDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,1)){
            return false;
        }
        // 다른 보호자 번호로는 생성 불가 , 비어 있으면 로그인한 보호자 번호로 채움
        Integer myGuardianNo = getMyGuardianNo(token);
        if (myGuardianNo == null || guardianInquiryDto == null){
            return false;
        }
        if (guardianInquiryDto.getGuardianNo() != null && !myGuardianNo.equals(guardianInquiryDto.getGuardianNo())){
            return false;
        }
        guardianInquiryDto.setGuardianNo(myGuardianNo);
        boolean result = guardianInquiryService.GuardianInquiryCreate(guardianInquiryDto);
        if (result){
            notifyService.toAdmin(NotifyType.NEW_INQUIRY, "새 문의가 등록되었습니다.");
        }
        return result;
    }

	// 2. 보호자 문의 수정 --> 보호자(1) 본인이 작성한 문의만
	@PutMapping("")
	public boolean GuardianInquiryModify(@CookieValue(value = "accessToken", required = false)String token,
                                         @RequestBody GuardianInquiryDto guardianInquiryDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,1)){
            return false;
        }
        if (guardianInquiryDto == null || !isMyInquiry(token, guardianInquiryDto.getInquiryNo())){
            return false;
        }
        // 문의 작성자를 다른 보호자로 바꿀 수 없도록 로그인한 보호자 번호로 고정
        Integer myGuardianNo = getMyGuardianNo(token);
        if (guardianInquiryDto.getGuardianNo() != null && !myGuardianNo.equals(guardianInquiryDto.getGuardianNo())){
            return false;
        }
        guardianInquiryDto.setGuardianNo(myGuardianNo);
		return guardianInquiryService.GuardianInquiryModify(guardianInquiryDto);
	}

	// 3. 보호자 문의 삭제 --> 보호자 + 관리자 화면이 사용
	//    관리자(4)는 전체 , 보호자(1)는 본인이 작성한 문의만
	@DeleteMapping("")
	public boolean GuardianInquiryDelete(@CookieValue(value = "accessToken", required = false)String token,
                                         @RequestParam Integer inquiryNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4) && !isMyInquiry(token, inquiryNo)){
            return false;
        }
		return guardianInquiryService.GuardianInquiryDelete(inquiryNo);
	}

	// 4. 보호자 문의 전체 조회 --> 관리자 문의 관리 + 보호자 요청·문의 화면이 사용
	//    관리자(4)는 전체 , 보호자(1)는 본인이 작성한 문의만 , 그 외는 빈 목록
	@GetMapping("")
	public List<GuardianInquiryDto>GuardianInquiryFindAll(@CookieValue(value = "accessToken", required = false)String token) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        if (authChecker.hasRole(token,4)){
            return guardianInquiryService.GuardianInquiryFindAll();
        }
        Integer myGuardianNo = getMyGuardianNo(token);
        if (myGuardianNo == null){
            return List.of();
        }
        List<GuardianInquiryDto> result = new ArrayList<>();
        for (GuardianInquiryDto dto : guardianInquiryService.GuardianInquiryFindAll()) {
            if (myGuardianNo.equals(dto.getGuardianNo())) result.add(dto);
        }
		return result;
	}
	// 기본 보호자CRUD기능

	// 5. 문의 응답 팝업 : 기존 근무자 + 희망 시간 기준 추천 3명 --> 관리자(4)
	//    GET /guardianinquiry/schedule-options?inquiryNo=15
	@GetMapping("/schedule-options")
	public InquiryScheduleOptionDto GuardianInquiryScheduleOptions(@CookieValue(value = "accessToken", required = false)String token,
                                                                   @RequestParam Integer inquiryNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return null;
        }
        if (!authChecker.hasRole(token,4)){
            return null;
        }
		return guardianInquiryService.GuardianInquiryScheduleOptions(inquiryNo);
	}

	// 6. 문의 응답 · 응답 수정 (배정 변경 포함) --> 관리자(4)
	//    PUT /guardianinquiry/answer  body : { inquiryNo, answerContent, applySchedule, careworkerNo }
	@PutMapping("/answer")
	public boolean GuardianInquiryAnswer(@CookieValue(value = "accessToken", required = false)String token,
                                         @RequestBody GuardianInquiryAnswerDto guardianInquiryAnswerDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }
		return guardianInquiryService.GuardianInquiryAnswer(guardianInquiryAnswerDto);
	}
}
