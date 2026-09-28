package oncare_backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import oncare_backend.model.entity.CareworkerReportEntity;

public interface CareWorkerReportRepository extends JpaRepository<CareworkerReportEntity, Integer>{
    
}
