package oncare_backend.controller;

import java.util.List;

import oncare_backend.service.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import oncare_backend.model.dto.CareRecipientDto;
import oncare_backend.service.CareRecipientService;

@RestController
@RequestMapping("/carerecipient")
public class CareRecipientController {

	@Autowired
	private CareRecipientService careRecipientService;
    @Autowired
    private JwtUtil jwtUtil;

	// 1. 수급자 등록 --> 유효성검사 보호자만 해야함. 
	@PostMapping("")
	public boolean CareRecipientSave(@CookieValue(value = "accessToken", required = false)String token,
                                     @RequestBody CareRecipientDto careRecipientDto) {
        if (token == null){
            return false;
        }
        Integer userNo = jwtUtil.getUserNoFromAccessToken(token);
        if (userNo == null){
            return false;
        }
        return careRecipientService.CareRecipientSave(careRecipientDto);
	}

	// 2. 수급자 전체 조회
	@GetMapping("")
	public List<CareRecipientDto> CareRecipientFindAll() {
		return careRecipientService.CareRecipientFindAll();
	}

	// 3. 수급자 상세 조회
	@GetMapping("/detail")
	public CareRecipientDto CareRecipientinquiry(@RequestParam Integer careRecipientNo) {
		return careRecipientService.CareRecipientinquiry(careRecipientNo);
	}

	// 4. 수급자 정보 수정
	@PutMapping("")
	public boolean CareRecipientModify(@RequestBody CareRecipientDto careRecipientDto) {
		return careRecipientService.CareRecipientModify(careRecipientDto);
	}

	// 5. 수급자 삭제 --> 보호자  + 관리자 
	@DeleteMapping("")
	public boolean CareRecipientDelete(@RequestParam(name="careRecipientNo")Integer careRecipientNo) {
		return careRecipientService.CareRecipientDelete(careRecipientNo);
	}
}
// 수급자 기본 CRUD 
// 수급자 등록(생성)  , 수급자 해제(삭제) , 수급자 특이사항(변경) / 주소(변경) , 수급자 조회(전체조회 / 상세조회(관리자))
