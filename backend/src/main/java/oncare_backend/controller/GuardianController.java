package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.GuardianDto;
import oncare_backend.service.GuardianService;

@RestController 
@RequestMapping("/api/보호자")
public class GuardianController {

	@Autowired
	private GuardianService guardianService;

	// 1. 보호자 전체 조회(관리자)
	@GetMapping
	public List<GuardianDto> 보호자전체조회() {
		return guardianService.보호자전체조회();
	}
}

// 관리자가 보호자를 전체조회하는 기능 . (아마 API 명세서 확인 후 내용추가 할 예정)