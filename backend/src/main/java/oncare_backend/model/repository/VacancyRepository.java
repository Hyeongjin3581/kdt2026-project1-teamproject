package oncare_backend.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.CareworkerReportEntity;

// 결원관리 전용 리포지토링
// 기존 CareWorkerReportRepository 를 수정하지 않기 위해 별도로 생성
@Repository
public interface VacancyRepository extends JpaRepository<CareworkerReportEntity, Integer> {

	// 근무상태로 근무기록 조회 ( 결원 판정 시 취소 기록 조회용 )
	List<CareworkerReportEntity> findByWorkStatus(String workStatus);

	// 서비스요청 번호로 근무기록 전체 조회 ( 거절/취소한 요양보호사, 유효한 배정여부 확인하기 전용 )
	List<CareworkerReportEntity> findByRequestEntity_RequestNo(Integer requestNo);
}
