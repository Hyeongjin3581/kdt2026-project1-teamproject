package oncare_backend.controller;

import java.util.List;

import oncare_backend.service.AuthChecker;
import oncare_backend.service.JwtUtil;
import oncare_backend.service.NotifyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.GuardianDto;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.repository.GuardianRepository;
import oncare_backend.service.GuardianService;

@RestController
@RequestMapping("/guardian")
public class GuardianController {

	@Autowired
	private GuardianService guardianService;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private AuthChecker authChecker;
    @Autowired
    private GuardianRepository guardianRepository;

    // 로그인한 보호자 번호 조회
    private Integer getMyGuardianNo(String accessToken) {
        if (!authChecker.hasRole(accessToken, 1)) return null;

        Integer userNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (userNo == null) return null;

        GuardianEntity guardian = guardianRepository.findByUserEntity_UserNo(userNo);
        if (guardian == null) return null;

        return guardian.getGuardianNo();
    }

	// 1. 보호자 전체 조회 --> 관리자 화면 + 보호자 화면(내 보호자 정보 찾기)이 사용하므로 로그인만 확인
	@GetMapping("")
	public List<GuardianDto> GuardianFindAll(@CookieValue(value = "accessToken", required = false)String token) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
		return guardianService.GuardianFindAll();
	}

	// 2. 보호자 수정 --> 보호자(1) 본인 정보만
	@PutMapping("")
	public boolean update(@CookieValue(value = "accessToken", required = false)String token,
                          @RequestBody GuardianDto guardianDto){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,1)){
            return false;
        }
        // 로그인한 보호자 번호와 수정할 보호자 번호가 같아야 함
        Integer myGuardianNo = getMyGuardianNo(token);
        if (myGuardianNo == null || guardianDto == null || !myGuardianNo.equals(guardianDto.getGuardianNo())){
            return false;
        }
		return guardianService.update(guardianDto);
	}


	// 3. 보호자 삭제 --> 관리자(4)
	@DeleteMapping("")
	public boolean delete(@CookieValue(value = "accessToken", required = false)String token,
                          @RequestParam(name="guardianNo") Integer guardianNo){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }
		return guardianService.delete(guardianNo);
	}

}
