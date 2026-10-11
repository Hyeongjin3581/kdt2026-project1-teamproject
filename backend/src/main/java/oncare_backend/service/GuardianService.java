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
	@Transactional // 트랜잭션이 없으면 엔티티 값만 바뀌고 DB에 반영(더티체킹)되지 않으므로 추가
	public boolean update(GuardianDto guardianDto){
		if (guardianDto == null || guardianDto.getGuardianNo() == null) {
			return false;
		}
		Optional<GuardianEntity> guardianEntity = guardianRepository.findById(guardianDto.getGuardianNo());
		if (guardianEntity.isPresent()){
			GuardianEntity gEntity = guardianEntity.get();

			// 탈퇴(delete) 상태인 보호자는 수정 불가
			if ("delete".equals(gEntity.getGuardianState())) { return false; }

			// 전달된 값만 수정 ( 빈 값으로 덮어쓰면 nullable = false 컬럼에서 저장 오류 발생 )
			if (guardianDto.getGuardianName() != null && !guardianDto.getGuardianName().isBlank()) {
				gEntity.setGuardianName(guardianDto.getGuardianName());
			}
			if (guardianDto.getGuardianRelationship() != null && !guardianDto.getGuardianRelationship().isBlank()) {
				gEntity.setGuardianRelationship(guardianDto.getGuardianRelationship());
			}
			return true; // 트랜잭션 종료 시점에 변경된 값이 자동으로 update 됨
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
