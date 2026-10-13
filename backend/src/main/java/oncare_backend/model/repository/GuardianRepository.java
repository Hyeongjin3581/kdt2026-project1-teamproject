package oncare_backend.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.GuardianEntity;

@Repository 
public interface GuardianRepository extends JpaRepository <GuardianEntity ,Integer> {

	List<GuardianEntity> findByGuardianState(String guardianState);
	Optional<GuardianEntity> findByUserEntity_UserNo(Integer usInteger);
}
