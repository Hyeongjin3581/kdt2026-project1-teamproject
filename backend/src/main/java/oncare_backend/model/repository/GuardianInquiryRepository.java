package oncare_backend.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.GuardianInquiryEntity;

@Repository
public interface  GuardianInquiryRepository extends JpaRepository <GuardianInquiryEntity , Integer> {
    // 요청 번호로 문의 조회 (요청 삭제 전에 연결을 끊을 때 사용)
    List<GuardianInquiryEntity> findByRequestEntity_RequestNo(Integer requestNo);
}
