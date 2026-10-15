package oncare_backend.model.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// ai_faq 테이블 한 행과 연결된다. 일반 문의와 별도로 공통 FAQ 초안을 저장한다.
// Lombok의 @Getter/@Setter가 필드 조회/수정 메서드를 만들어 준다.
@Entity
@Table(name = "ai_faq")
@Getter @Setter
public class AiFaqEntity {

    // PK: MySQL AUTO_INCREMENT로 FAQ 번호가 만들어진다.
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "faq_no")
    private Integer faqNo;

    // 원본 문의 번호. unique=true로 같은 문의의 FAQ 중복 생성을 막는다.
    // 관리자 응답에는 표시하지만 보호자의 공개 FAQ 응답에는 포함하지 않는다.
    // Integer 번호만 저장하며 JPA 연관 객체로 연결한 필드는 아니다.
    @Column(name = "source_inquiry_no", nullable = false, unique = true)
    private Integer sourceInquiryNo;

    // AI가 만든 질문 또는 관리자가 수정한 질문. 실제 DB 컬럼명은 question_text이다.
    @Column(name = "question_text", nullable = false, length = 500)
    private String questionText;

    // guardianinquiry.answerContent의 스냅샷(복사본). 원본 수정이 자동 반영되지는 않는다.
    @Column(name = "answer_text", nullable = false, length = 1000)
    private String answerText;

    // false: 검토 전 초안, true: 보호자에게 공개. 생성/편집하면 다시 false가 된다.
    @Column(name = "approved", nullable = false)
    private boolean approved = false;

    // 생성/편집/승인 변경 시 Service가 LocalDateTime.now()를 넣는다.
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
