package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.GuardianInquiryDto;
import oncare_backend.service.GuardianInquiryService;

@RestController 
@RequestMapping("/api/보호자문의")
public class GuardianInquiryController {

	@Autowired
	private GuardianInquiryService guardianInquiryService;

	// 1. 보호자 문의 생성
	@PostMapping
	public boolean 보호자문의생성(@RequestBody GuardianInquiryDto guardianInquiryDto) {
		return guardianInquiryService.보호자문의생성(guardianInquiryDto);
	}

	// 2. 보호자 문의 수정
	@PutMapping("/{inquiryNo}")
	public boolean 보호자문의수정(
			@PathVariable Integer inquiryNo,
			@RequestBody GuardianInquiryDto guardianInquiryDto) {
		return guardianInquiryService.보호자문의수정(inquiryNo, guardianInquiryDto);
	}

	// 3. 보호자 문의 삭제
	@DeleteMapping("/{inquiryNo}")
	public boolean 보호자문의삭제(@PathVariable Integer inquiryNo) {
		return guardianInquiryService.보호자문의삭제(inquiryNo);
	}

	// 4. 보호자 문의 전체 조회(관리자)
	@GetMapping
	public List<GuardianInquiryDto> 보호자문의전체조회() {
		return guardianInquiryService.보호자문의전체조회();
	}
}

// 기본 보호자CRUD기능