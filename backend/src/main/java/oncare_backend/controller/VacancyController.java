package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.CareWorkerRecommendationDto;
import oncare_backend.model.dto.VacancyDto;
import oncare_backend.service.VacancyService;

@RestController
@RequestMapping("/vacancy")
public class VacancyController {

	@Autowired
	private VacancyService vacancyService;

	// 1. 결원 목록 조회(관리자)
	@GetMapping("")
	public List<VacancyDto> findAll(@RequestParam(name = "centerNo") Integer centerNo) {
		return vacancyService.findAll(centerNo);
	}

	// 2. 대체 후보 재추천(관리자)
	// 거절/취소한 요양보호사 제외 상위 3명 추천 
	@GetMapping("/detail")
	public List<CareWorkerRecommendationDto> vacancyDetail(@RequestParam(name = "requestNo") Integer requestNo) {
		return vacancyService.vacancyDetail(requestNo);
	}
}

// 결원관리 기능
// 결원 목록 조회 , 대체 후보 재추천
// 관리자가 상위 3명 중 한 명을 눌러 "배정하기"를 했을 때 @PostMapping("/assign")사용
