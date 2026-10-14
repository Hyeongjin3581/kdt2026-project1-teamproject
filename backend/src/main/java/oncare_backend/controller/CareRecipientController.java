package oncare_backend.controller;

import java.util.List;

import oncare_backend.service.AuthChecker;
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
    @Autowired
    private AuthChecker authChecker;

	// 1. 수급자 등록 --> 보호자(1)만
	@PostMapping("")
	public boolean CareRecipientSave(@CookieValue(value = "accessToken", required = false)String token,
                                     @RequestBody CareRecipientDto careRecipientDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,1)){
            return false;
        }
        return careRecipientService.CareRecipientSave(careRecipientDto);
	}

	// 2. 수급자 전체 조회 --> 관리자, 요양보호사, 보호자 화면이 모두 사용하므로 로그인만 확인
	@GetMapping("")
	public List<CareRecipientDto> CareRecipientFindAll(@CookieValue(value = "accessToken", required = false)String token) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
		return careRecipientService.CareRecipientFindAll();
	}

	// 3. 수급자 상세 조회 --> 로그인만 확인
	@GetMapping("/detail")
	public CareRecipientDto CareRecipientinquiry(@CookieValue(value = "accessToken", required = false)String token,
                                                 @RequestParam Integer careRecipientNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return null;
        }
		return careRecipientService.CareRecipientinquiry(careRecipientNo);
	}

	// 4. 수급자 정보 수정 --> 보호자 + 관리자 (공용 수정 창) 이므로 로그인만 확인
	@PutMapping("")
	public boolean CareRecipientModify(@CookieValue(value = "accessToken", required = false)String token,
                                       @RequestBody CareRecipientDto careRecipientDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
		return careRecipientService.CareRecipientModify(careRecipientDto);
	}

	// 5. 수급자 삭제 --> 보호자 + 관리자 이므로 로그인만 확인
	@DeleteMapping("")
	public boolean CareRecipientDelete(@CookieValue(value = "accessToken", required = false)String token,
                                       @RequestParam(name="careRecipientNo")Integer careRecipientNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
		return careRecipientService.CareRecipientDelete(careRecipientNo);
	}
}
// 수급자 기본 CRUD
// 수급자 등록(생성)  , 수급자 해제(삭제) , 수급자 특이사항(변경) / 주소(변경) , 수급자 조회(전체조회 / 상세조회(관리자))
