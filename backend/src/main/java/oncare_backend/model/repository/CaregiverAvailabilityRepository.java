package oncare_backend.model.repository;

import oncare_backend.model.entity.CareworkerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.CaregiverAvailabilityEntity;

import java.time.LocalDate;
import java.util.List;

@Repository 
public interface CaregiverAvailabilityRepository extends JpaRepository<CaregiverAvailabilityEntity, Integer>{
    List<CaregiverAvailabilityEntity> findByCareworkerEntityAndAvailableDate(CareworkerEntity careworkerEntity, LocalDate availableDate);
}