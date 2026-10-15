package oncare_backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import oncare_backend.model.entity.ReviewSentimentEntity;

// 분석 결과 Entity의 기본 조회/저장 기능. PK 타입은 Integer이다.
public interface ReviewSentimentRepository extends JpaRepository<ReviewSentimentEntity, Integer> {
    // reviewEntity 안의 reviewNo로 찾는다. 밑줄(_)은 연관 객체 필드의 경로를 구분한다.
    // 분석 결과 PK(sentimentNo)로 찾는 메서드와 구분해야 한다.
    ReviewSentimentEntity findByReviewEntity_ReviewNo(Integer reviewNo);
}
