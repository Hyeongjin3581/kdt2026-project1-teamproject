package oncare_backend.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.GuardianEntity;

@Repository 
public interface GuardianRepository extends JpaRepository <GuardianEntity ,Integer> {

	List<GuardianEntity> findByGuardianState(String guardianState);

	// 회원 번호로 보호자 조회 ( 회원 탈퇴 시 보호자 상태도 함께 변경 )
	GuardianEntity findByUserEntity_UserNo(Integer userNo);
}
