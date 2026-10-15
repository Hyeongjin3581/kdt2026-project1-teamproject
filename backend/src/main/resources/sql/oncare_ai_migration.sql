-- 기존 ONCARE 테이블은 변경하지 않고 AI 전용 테이블만 추가 (MySQL)
-- 적용 전 DB 백업. 개발 환경에서만 실행해 먼저 검증할 것.

-- [1] 후기 분석 결과 테이블. IF NOT EXISTS: 이미 테이블이 있으면 새로 만들지 않는다.
-- 이 파일은 테이블을 만들지만 Gemini 분석이나 후기 데이터 등록을 실행하지 않는다.
CREATE TABLE IF NOT EXISTS review_sentiment (
    -- 분석 PK / 원본 후기 FK / AI 분류 / 원문 비교값 / 분석 시각
    sentiment_no INT NOT NULL AUTO_INCREMENT,
    review_no INT NOT NULL,
    sentiment VARCHAR(20) NOT NULL,
    content_hash CHAR(64) NOT NULL,
    analyzed_at DATETIME NOT NULL,
    PRIMARY KEY (sentiment_no),
    -- 후기마다 결과는 한 건만 저장한다. 같은 후기 재분석은 기존 결과 갱신이다.
    UNIQUE KEY uq_review_sentiment_review (review_no),
    -- 원본 후기가 삭제되면 연결된 분석 결과도 삭제한다. 다른 후기 결과는 유지된다.
    CONSTRAINT fk_review_sentiment_review FOREIGN KEY (review_no)
        REFERENCES careworkerreview(review_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- [2] 공통 FAQ 테이블. 개인 문의를 복사하여 질문·답변·관리자 승인 상태를 별도로 저장한다.
CREATE TABLE IF NOT EXISTS ai_faq (
    -- FAQ PK / 원본 문의 번호 / 공통 질문 / DB 답변 복사본 / 공개 여부 / 수정 시각
    faq_no INT NOT NULL AUTO_INCREMENT,
    source_inquiry_no INT NOT NULL,
    question_text VARCHAR(500) NOT NULL,
    answer_text VARCHAR(1000) NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (faq_no),
    -- 원본 문의 번호는 중복 방지에 쓰지만 여기에는 guardianinquiry FK를 설정하지 않았다.
    UNIQUE KEY uq_ai_faq_source (source_inquiry_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 기존 문의 삭제/수정으로 인한 FAQ 공개 내용은 자동 변경되지 않음.
-- 관리자 '재생성 → 미승인 → 검토 → 승인' 흐름으로 관리한다.
