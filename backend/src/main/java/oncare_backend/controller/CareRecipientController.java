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

import oncare_backend.model.dto.CareRecipientDto;
import oncare_backend.service.CareRecipientService;

@RestController
@RequestMapping("/carerecipient")
public class CareRecipientController {

	@Autowired
	private CareRecipientService careRecipientService;

	// 1. 수급자 등록
	@PostMapping
	public boolean CareRecipientSave(@RequestBody CareRecipientDto careRecipientDto) {
		return careRecipientService.CareRecipientSave(careRecipientDto);
	}

	// 2. 수급자 전체 조회
	@GetMapping
	public List<CareRecipientDto> CareRecipientFindAll() {
		return careRecipientService.CareRecipientFindAll();
	}

	// 3. 수급자 상세 조회
	@GetMapping("/{careRecipientNo}")
	public CareRecipientDto CareRecipientinquiry(@PathVariable Integer careRecipientNo) {
		return careRecipientService.CareRecipientinquiry(careRecipientNo);
	}

	// 4. 수급자 정보 수정
	@PutMapping("/{careRecipientNo}")
	public boolean CareRecipientModify(
			@PathVariable Integer careRecipientNo,
			@RequestBody CareRecipientDto careRecipientDto) {
		return careRecipientService.CareRecipientModify(careRecipientNo, careRecipientDto);
	}

	// 5. 수급자 삭제
	@DeleteMapping("/{careRecipientNo}")
	public boolean CareRecipientDelete(@PathVariable Integer careRecipientNo) {
		return careRecipientService.CareRecipientDelete(careRecipientNo);
	}
}
// 수급자 기본 CRUD 
// 수급자 등록(생성)  , 수급자 해제(삭제) , 수급자 특이사항(변경) / 주소(변경) , 수급자 조회(전체조회 / 상세조회(관리자))
