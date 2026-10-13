package oncare_backend.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.CareworkerReviewEntity;

public interface CareworkerReviewRepository
        extends JpaRepository<CareworkerReviewEntity,Integer> {

    CareworkerReviewEntity findByCareworkerReportEntity(
        CareworkerReportEntity careworkerReportEntity);

    List<CareworkerReviewEntity>
    findByCareworkerReportEntity_CareworkerEntity_CareworkerNo(
        Integer careworkersNo);

    List<CareworkerReviewEntity>
    findByGuardianEntity_GuardianNo(Integer guardianNo);

}