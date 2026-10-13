package oncare_backend.controller;

import java.util.List;

import oncare_backend.service.NotifyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.GuardianDto;
import oncare_backend.service.GuardianService;

@RestController 
@RequestMapping("/guardian")
public class GuardianController {

	@Autowired
	private GuardianService guardianService;

	// 1. 보호자 전체 조회(관리자)
	@GetMapping("")
	public List<GuardianDto> GuardianFindAll() {
		return guardianService.GuardianFindAll();
	}

	// 2. 보호자 수정 --> Access 토큰 확인 후 userCategory가 1번일때만 수정 가능하게 해야함. (유효성검사)
	@PutMapping("")
	public boolean update(@RequestBody GuardianDto guardianDto){
		return guardianService.update(guardianDto);
	}


	// 3. 보호자 삭제 
	@DeleteMapping("")
	public boolean delete(@RequestParam(name="guardianNo") Integer guardianNo){
		return guardianService.delete(guardianNo);
	}

}
