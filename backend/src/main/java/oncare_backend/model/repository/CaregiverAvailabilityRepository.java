package oncare_backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.CaregiverAvailabilityEntity;

@Repository 
public interface CaregiverAvailabilityRepository extends JpaRepository<CaregiverAvailabilityEntity, Integer>{

    
}