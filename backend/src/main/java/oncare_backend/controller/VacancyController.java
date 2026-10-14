package oncare_backend.controller;

import java.util.List;

import oncare_backend.service.AuthChecker;
import oncare_backend.service.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.model.dto.VacancyDto;
import oncare_backend.service.VacancyService;

@RestController
@RequestMapping("/vacancy")
public class VacancyController {

	@Autowired
	private VacancyService vacancyService;
    @Autowired
    private AuthChecker authChecker;
    @Autowired
    private JwtUtil jwtUtil;

	// 1. 결원 목록 조회(관리자)
	@GetMapping("")
	public List<VacancyDto> findAll(@CookieValue(value = "accessToken", required = false)String token,
                                    @RequestParam(name = "centerNo", required = false) Integer centerNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        if (!authChecker.hasRole(token,4)){
            return List.of();
        }
        return vacancyService.findAll(centerNo);
	}

	// 2. 대체 후보 재추천(관리자)
	// 거절/취소한 요양보호사 제외 상위 3명 추천 
	@GetMapping("/detail")
	public List<CareWorkerRecommendationDto> vacancyDetail(@CookieValue(value = "accessToken", required = false)String token,
                                                           @RequestParam(name = "requestNo", required = false) Integer requestNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        if (!authChecker.hasRole(token,4)){
            return List.of();
        }
        return vacancyService.vacancyDetail(requestNo);
	}
}

// 결원관리 기능
// 결원 목록 조회 , 대체 후보 재추천
// 관리자가 상위 3명 중 한 명을 눌러 "배정하기"를 했을 때 @PostMapping("/assign")사용
