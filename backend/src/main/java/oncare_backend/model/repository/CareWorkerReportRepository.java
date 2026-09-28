package oncare_backend.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import oncare_backend.model.entity.CareworkerReportEntity;

public interface CareWorkerReportRepository extends JpaRepository<CareworkerReportEntity, Integer>{
    // [1] 센터별 근무기록 조회시 센터 번호를 가져오기 위한 쿼리 메소드
    // careworker.centerEntity.centerNo 기준 조회
    List<CareworkerReportEntity> findByCareworkerEntity_CenterEntity_CenterNo(Integer centerNo);

    List<CareworkerReportEntity> findByCareworkerEntity_CareworkerNo(Integer careworkerNo);
}
