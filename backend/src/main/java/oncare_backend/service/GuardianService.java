package oncare_backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import oncare_backend.model.dto.GuardianDto;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.repository.GuardianRepository;

@Service 
public class GuardianService {

	@Autowired
	private GuardianRepository guardianRepository;

	// 1. 이용 중인 보호자 전체 조회(관리자)
	@Transactional(readOnly = true)
	public List<GuardianDto> GuardianFindAll() {
		return guardianRepository.findByGuardianState("use").stream()
				.map(GuardianDto::entityToDto)
				.toList();
	}

	// 2. 보호자 수정 (보호자 페이지)
	public boolean update(GuardianDto guardianDto){
		if (guardianDto == null || guardianDto.getGuardianNo() == null) {
        return false;
    }
		Optional<GuardianEntity> guardianEntity = guardianRepository.findById(guardianDto.getGuardianNo());
		if (guardianEntity.isPresent()){
			GuardianEntity gEntity = guardianEntity.get();
			gEntity.setGuardianName(guardianDto.getGuardianName());
			gEntity.setGuardianRelationship(guardianDto.getGuardianRelationship());
			return true;
		}
		return false;
	}
	

	// 3. 보호자 탈퇴--> 행을 삭제하지 않고 상태만 변경
	@Transactional
	public boolean delete(Integer guardianNo) {
		if (guardianNo == null) { return false; }
		GuardianEntity guardian = guardianRepository.findById(guardianNo).orElse(null);
		if (guardian == null) { return false; }
		guardian.setGuardianState("delete");
		return true;
	}
}
