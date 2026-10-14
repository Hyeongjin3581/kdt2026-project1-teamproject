package oncare_backend.controller;

import java.util.List;

import oncare_backend.model.dto.NotifyType;
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

	// 1. 보호자 문의 생성 --> 보호자(1)
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
        boolean result = guardianInquiryService.GuardianInquiryCreate(guardianInquiryDto);
        if (result){
            notifyService.toAdmin(NotifyType.NEW_INQUIRY, "새 문의가 등록되었습니다.");
        }
        return result;
    }

	// 2. 보호자 문의 수정 --> 보호자(1)
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
		return guardianInquiryService.GuardianInquiryModify(guardianInquiryDto);
	}

	// 3. 보호자 문의 삭제 --> 보호자 + 관리자 화면이 사용하므로 로그인만 확인
	@DeleteMapping("")
	public boolean GuardianInquiryDelete(@CookieValue(value = "accessToken", required = false)String token,
                                         @RequestParam Integer inquiryNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
		return guardianInquiryService.GuardianInquiryDelete(inquiryNo);
	}

	// 4. 보호자 문의 전체 조회 --> 관리자 문의 관리 + 보호자 요청·문의 화면이 사용하므로 로그인만 확인
	@GetMapping("")
	public List<GuardianInquiryDto>GuardianInquiryFindAll(@CookieValue(value = "accessToken", required = false)String token) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
		return guardianInquiryService.GuardianInquiryFindAll();
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
