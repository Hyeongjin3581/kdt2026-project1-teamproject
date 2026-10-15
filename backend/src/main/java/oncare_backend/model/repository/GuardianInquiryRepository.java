package oncare_backend.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.GuardianInquiryEntity;

@Repository
public interface  GuardianInquiryRepository extends JpaRepository <GuardianInquiryEntity , Integer> {
    // 요청 번호로 문의 조회 (요청 삭제 전에 연결을 끊을 때 사용)
    List<GuardianInquiryEntity> findByRequestEntity_RequestNo(Integer requestNo);

    List<GuardianInquiryEntity> findByGuardianEntity_GuardianNoAndInquiryCategoryEntity_InquiryCategoryNo(
            Integer guardianNo, Integer inquiryCategoryNo);

    // UUID 키는 보호자별로 조회한다. 다른 보호자의 같은 키/문의 번호를 재사용하지 않는다.
    Optional<GuardianInquiryEntity> findByGuardianEntity_GuardianNoAndInquiryGroup(Integer guardianNo, String inquiryGroup);
}
