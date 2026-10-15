package oncare_backend.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.GuardianEntity;

@Repository 
public interface GuardianRepository extends JpaRepository <GuardianEntity ,Integer> {

	List<GuardianEntity> findByGuardianState(String guardianState);
	// 회원 번호로 보호자 조회 ( 회원 탈퇴 시 보호자 상태도 함께 변경 )
	GuardianEntity findByUserEntity_UserNo(Integer userNo);

    // handoff 전용: 같은 보호자의 중복 확인과 저장을 DB 트랜잭션 안에서 순서대로 처리한다.
    // 기존 조회 메서드에는 잠금을 추가하지 않으므로 다른 CRUD의 동작은 유지한다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select g from GuardianEntity g where g.userEntity.userNo = :userNo")
    Optional<GuardianEntity> findForInquiryHandoff(@Param("userNo") Integer userNo);
}
