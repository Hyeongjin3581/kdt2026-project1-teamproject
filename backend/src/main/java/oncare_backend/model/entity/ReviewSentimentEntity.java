package oncare_backend.model.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// review_sentiment 테이블: 후기 원문과 분리해 분류, 내용 비교값, 분석일을 저장한다.
@Entity
@Table(name = "review_sentiment")
@Getter @Setter
public class ReviewSentimentEntity {

    // PK: 분석 결과 번호이며 후기 번호(reviewNo)와는 다른 번호이다.
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sentiment_no")
    private Integer sentimentNo;

    // 후기 하나에 분석 결과 하나. 재분석은 기존 행을 갱신한다.
    // LAZY: 연결 정보가 필요할 때 조회. review_no는 후기 테이블을 가리키는 FK이다.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_no", nullable = false, unique = true)
    private CareworkerReviewEntity reviewEntity;

    // 유효한 감정 5개 중 하나인지 Service에서 검사한다.
    @Column(name = "sentiment", nullable = false, length = 20)
    private String sentiment;

    // 분석 당시 원문의 SHA-256 값. 현재 해시와 다르면 과거 감정이므로 최신 결과로 쓰지 않는다.
    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    // 분석이 성공해 저장된 시각. 캐시 조회만 할 때는 갱신하지 않는다.
    @Column(name = "analyzed_at", nullable = false)
    private LocalDateTime analyzedAt;
}
