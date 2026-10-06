package oncare_backend.model.repository;

import java.time.LocalDate;
import java.util.List;

import oncare_backend.model.entity.CareworkerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import oncare_backend.model.entity.CareworkerReportEntity;
import org.springframework.data.repository.query.Param;

public interface CareWorkerReportRepository extends JpaRepository<CareworkerReportEntity, Integer>{
    // [1] 센터별 근무기록 조회시 센터 번호를 가져오기 위한 쿼리 메소드
    // careworker.centerEntity.centerNo 기준 조회
    List<CareworkerReportEntity> findByCareworkerEntity_CenterEntity_CenterNo(Integer centerNo);

    List<CareworkerReportEntity> findByCareworkerEntity_CareworkerNo(Integer careworkerNo);

    List<CareworkerReportEntity> findByCareworkerEntityAndWorkDate(CareworkerEntity careworkerEntity, LocalDate workDate);


    // 후보 전체의 최근 30일 완료 근무횟수 집계
    // 한 요청(request_no)을 한 번의 방문 근무로 계산
    // 같은 보호사·요청의 완료 기록이 중복되어도 1회로 집계
    // CareWorkerRecommendationService에서 조회 요청 시 사용됨.
    @Query(value = """
            SELECT careworker_no AS careworkerNo,
                COUNT(DISTINCT request_no) AS workCount
            FROM careworkersreport
            WHERE careworker_no IN (:workerNos)
            AND work_date >= :startDate
            AND work_date < :endDate
            AND work_status = '완료'
            GROUP BY careworker_no
            """, nativeQuery = true)

    List<WorkCount> countCompletedWork(
            @Param("workerNos") List<Integer> workerNos,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // 조회 결과를 받을 인터페이스
    interface WorkCount {
        Integer getCareworkerNo(); // SQL의 careworkerNo 값
        Long getWorkCount(); // SQL의 workCount 값
    }
}
