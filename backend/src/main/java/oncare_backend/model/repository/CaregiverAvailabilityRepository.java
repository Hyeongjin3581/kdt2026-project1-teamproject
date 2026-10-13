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

    // 요양보호사 번호로 근무가능시간 조회 ( 요양보호사 삭제 전 확인용 )
    List<CaregiverAvailabilityEntity> findByCareworkerEntity_CareworkerNo(Integer careworkerNo);
}