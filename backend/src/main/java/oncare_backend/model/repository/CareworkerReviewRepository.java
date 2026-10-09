package oncare_backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.CareworkerReviewEntity;

public interface CareworkerReviewRepository extends JpaRepository<CareworkerReviewEntity,Integer>{
    CareworkerReviewEntity findByCareworkerReportEntity(CareworkerReportEntity careworkerReportEntity);
}
