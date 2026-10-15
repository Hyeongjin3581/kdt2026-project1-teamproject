package oncare_backend.model.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import oncare_backend.model.entity.AiFaqEntity;

// JpaRepository<Entity, PK 타입>이 기본 findAll/findById/save 등을 제공한다.
public interface AiFaqRepository extends JpaRepository<AiFaqEntity, Integer> {
    // 원본 문의 번호로 기존 FAQ 조회. 같은 문의를 재생성할 때 기존 행을 찾아 갱신한다.
    AiFaqEntity findBySourceInquiryNo(Integer sourceInquiryNo);
    // Spring Data JPA가 이름으로 쿼리를 만든다: 승인=true 조건 + FAQ 번호 오름차순.
    List<AiFaqEntity> findByApprovedTrueOrderByFaqNoAsc();
}
