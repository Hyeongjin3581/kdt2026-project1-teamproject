package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.GuardianInquiryDto;
import oncare_backend.service.GuardianInquiryService;

@RestController 
@RequestMapping("/guardianinquiry")
@CrossOrigin(origins = "*")
public class GuardianInquiryController {

	@Autowired
	private GuardianInquiryService guardianInquiryService;

	// 1. 보호자 문의 생성
	@PostMapping("")
	public boolean GuardianInquiryCreate(@RequestBody GuardianInquiryDto guardianInquiryDto) {
		return guardianInquiryService.GuardianInquiryCreate(guardianInquiryDto);
	}

	// 2. 보호자 문의 수정
	@PutMapping("")
	public boolean GuardianInquiryModify(@RequestBody GuardianInquiryDto guardianInquiryDto) {
		return guardianInquiryService.GuardianInquiryModify(guardianInquiryDto);
	}

	// 3. 보호자 문의 삭제
	@DeleteMapping("")
	public boolean GuardianInquiryDelete(@RequestParam Integer inquiryNo) {
		return guardianInquiryService.GuardianInquiryDelete(inquiryNo);
	}

	// 4. 보호자 문의 전체 조회(관리자)
	@GetMapping("")
	public List<GuardianInquiryDto>GuardianInquiryFindAll() {
		return guardianInquiryService.GuardianInquiryFindAll();
	}
}

// 기본 보호자CRUD기능