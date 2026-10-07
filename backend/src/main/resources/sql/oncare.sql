ㅛ-- 샘플 데이터 (테이블은 JPA 엔티티가 생성하므로 INSERT 만 작성)
-- INSERT IGNORE : 이미 같은 번호가 있으면 건너뛰어 재시작해도 오류가 나지 않는다.
-- 위도/경도는 추천(거리 점수) 계산에 쓰이므로 동 단위 대략 좌표를 함께 넣는다.
-- 비밀번호는 모두 같은 BCrypt 해시이다.

-- 1. 사용자 카테고리
CREATE TABLE usercategory (
    user_category_no INT NOT NULL AUTO_INCREMENT,
    user_category_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_category_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 센터
CREATE TABLE center (
    center_no INT NOT NULL AUTO_INCREMENT,
    center_name VARCHAR(50) NOT NULL,
    center_address VARCHAR(255) NOT NULL,
    center_phonenumber VARCHAR(20) NOT NULL,
    PRIMARY KEY (center_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 사용자
CREATE TABLE `user` (
    user_no INT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    user_category_no INT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_no),
    UNIQUE KEY uk_user_id (user_id),
    UNIQUE KEY uk_user_email (email),
    FOREIGN KEY (user_category_no)
        REFERENCES usercategory(user_category_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 보호자
CREATE TABLE guardians (
    guardian_no INT NOT NULL AUTO_INCREMENT,
    user_no INT NOT NULL UNIQUE,
    guardian_name VARCHAR(10) NOT NULL,
    guardian_relationship VARCHAR(20) NOT NULL,
    create_date DATETIME(6) NULL,
    update_date DATETIME(6) NULL,
    PRIMARY KEY (guardian_no),
    FOREIGN KEY (user_no)
        REFERENCES `user`(user_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 수급자
CREATE TABLE carerecipients (
    carerecipient_no INT NOT NULL AUTO_INCREMENT,
    guardian_no INT NULL,
    carerecipient_name VARCHAR(50) NOT NULL,
    carerecipient_age INT NOT NULL,
    carerecipient_address VARCHAR(255) NOT NULL,
    carerecipient_gender CHAR(2) NOT NULL,
    care_recipient_content VARCHAR(255),
    latitude DOUBLE NOT NULL DEFAULT 0,
    longitude DOUBLE NOT NULL DEFAULT 0,
    create_date DATETIME(6) NULL,
    update_date DATETIME(6) NULL,
    PRIMARY KEY (carerecipient_no),
    FOREIGN KEY (guardian_no)
        REFERENCES guardians(guardian_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 요양보호사
CREATE TABLE careworkers (
    careworker_no INT NOT NULL AUTO_INCREMENT,
    careworker_name VARCHAR(50) NOT NULL,
    careworker_address VARCHAR(255) NOT NULL,
    careworker_gender CHAR(2) NOT NULL,
    hour_wage INT NOT NULL,
    careworker_age INT NOT NULL,
    careworker_state VARCHAR(10) NOT NULL,
    sign_state VARCHAR(10) NOT NULL DEFAULT '승인대기',

    latitude DOUBLE NOT NULL DEFAULT 0,
    longitude DOUBLE NOT NULL DEFAULT 0,
    center_no INT NOT NULL,
    user_no INT NOT NULL UNIQUE,
    PRIMARY KEY (careworker_no),
    FOREIGN KEY (center_no)
        REFERENCES center(center_no),
    FOREIGN KEY (user_no)
        REFERENCES `user`(user_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 근무 가능 시간
CREATE TABLE caregiveravailability (
    availability_no INT NOT NULL AUTO_INCREMENT,
    caregiver_no INT NOT NULL,
    available_date DATE NOT NULL,
    start_time INT NULL,
    end_time INT NULL,
    status VARCHAR(20) NOT NULL,
    PRIMARY KEY (availability_no),
    FOREIGN KEY (caregiver_no)
        REFERENCES careworkers(careworker_no),
    CONSTRAINT ck_caregiveravailability_start_time
        CHECK (start_time BETWEEN 0 AND 2359 AND MOD(start_time, 100) BETWEEN 0 AND 59),
    CONSTRAINT ck_caregiveravailability_end_time
        CHECK (end_time BETWEEN 0 AND 2359 AND MOD(end_time, 100) BETWEEN 0 AND 59),
    CONSTRAINT ck_availability_time_pair
        CHECK ((start_time IS NULL AND end_time IS NULL)
            OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)),
    CONSTRAINT ck_availability_workable
        CHECK (status <> '근무가능' OR (start_time IS NOT NULL AND end_time IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 방문 서비스 요청
CREATE TABLE requests (
    request_no INT NOT NULL AUTO_INCREMENT,
    carerecipient_no INT NOT NULL,
    preferred_gender VARCHAR(5),
    request_state VARCHAR(20) NOT NULL,
    visit_date DATE NOT NULL,
    visit_start_time INT NOT NULL,
    visit_end_time INT NOT NULL,
    request_content VARCHAR(255),
    request_created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (request_no),
    FOREIGN KEY (carerecipient_no)
        REFERENCES carerecipients(carerecipient_no),
    CONSTRAINT ck_requests_visit_start_time
        CHECK (visit_start_time BETWEEN 0 AND 2359 AND MOD(visit_start_time, 100) BETWEEN 0 AND 59),
    CONSTRAINT ck_requests_visit_end_time
        CHECK (visit_end_time BETWEEN 0 AND 2359 AND MOD(visit_end_time, 100) BETWEEN 0 AND 59),
    CONSTRAINT ck_requests_time_order CHECK (visit_start_time < visit_end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 근무 기록
CREATE TABLE careworkersreport (
    careworkers_report_no INT NOT NULL AUTO_INCREMENT,
    careworker_no INT NOT NULL,
    request_no INT NOT NULL,
    work_date DATE NOT NULL,
    work_start_time INT NOT NULL,
    work_end_time INT NOT NULL,
    work_status VARCHAR(50) NOT NULL,
    PRIMARY KEY (careworkers_report_no),
    FOREIGN KEY (careworker_no)
        REFERENCES careworkers(careworker_no),
    FOREIGN KEY (request_no)
        REFERENCES requests(request_no),
    CONSTRAINT ck_careworkersreport_work_start_time
        CHECK (work_start_time BETWEEN 0 AND 2359 AND MOD(work_start_time, 100) BETWEEN 0 AND 59),
    CONSTRAINT ck_careworkersreport_work_end_time
        CHECK (work_end_time BETWEEN 0 AND 2359 AND MOD(work_end_time, 100) BETWEEN 0 AND 59),
    CONSTRAINT ck_careworkersreport_time_order CHECK (work_start_time < work_end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 문의 카테고리
CREATE TABLE inquirycategory (
    inquiry_category_no INT NOT NULL AUTO_INCREMENT,
    inquiry_category_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (inquiry_category_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE guardianinquiry (
    inquiry_no INT NOT NULL AUTO_INCREMENT,
    guardian_no INT NOT NULL,
    inquiry_category_no INT NOT NULL,
    wish_date DATE NULL,
    wish_start_time INT NULL,
    wish_end_time INT NULL,
    inquiry_content VARCHAR(1000),
    create_date DATETIME(6) NULL,
    update_date DATETIME(6) NULL,
    PRIMARY KEY (inquiry_no),
    FOREIGN KEY (guardian_no)
        REFERENCES guardians(guardian_no),
    FOREIGN KEY (inquiry_category_no)
        REFERENCES inquirycategory(inquiry_category_no),
    CONSTRAINT ck_guardianinquiry_wish_start_time
        CHECK (wish_start_time IS NULL OR (wish_start_time BETWEEN 0 AND 2359 AND MOD(wish_start_time, 100) BETWEEN 0 AND 59)),
    CONSTRAINT ck_guardianinquiry_wish_end_time
        CHECK (wish_end_time IS NULL OR (wish_end_time BETWEEN 0 AND 2359 AND MOD(wish_end_time, 100) BETWEEN 0 AND 59)),
    CONSTRAINT ck_guardianinquiry_wish_time_pair
        CHECK ((wish_start_time IS NULL AND wish_end_time IS NULL)
            OR (wish_start_time IS NOT NULL AND wish_end_time IS NOT NULL AND wish_start_time < wish_end_time))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 입력: 아래 데이터는 개발/추천 로직 검증용입니다.
-- 좌표는 원본 파일의 테스트 좌표이며 실제 주소 지오코딩 결과가 아닙니다.
-- 좌표가 0인 수급자는 좌표 미등록 상태로 보고 거리 추천에서 제외하세요.
START TRANSACTION;

-- 사용자 카테고리 샘플

INSERT INTO usercategory
(user_category_no, user_category_name)
VALUES
(1, '보호자'),
(2, '요양보호사'),
(3, '센터 관리자'),
(4, '시스템 관리자');

-- 2. 센터
INSERT IGNORE INTO center (center_no, center_name, center_address, center_phonenumber) VALUES
(1, '안양 온케어 방문요양센터', '경기도 안양시 동안구 시민대로 180', '031-380-1001'),
(2, '시흥 온케어 방문요양센터', '경기도 시흥시 능곡로 120', '031-310-2001'),
(3, '수원 온케어 방문요양센터', '경기도 수원시 팔달구 효원로 250', '031-240-3001');

-- 3. 사용자
INSERT IGNORE INTO `user` (user_no, user_id, user_password, phone_number, email, user_category_no) VALUES
(1,  'admin01',      '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-1234-5678', 'admin01@example.com',      4),
(2,  'center01',     '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-1235-1235', 'center01@example.com',     3),
(3,  'center02',     '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-1010-1010', 'center02@example.com',     3),
(4,  'center03',     '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-0987-6543', 'center03@example.com',     3),
(5,  'careworker01', '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-8766-2342', 'careworker01@example.com', 2),
(6,  'careworker02', '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-1557-1557', 'careworker02@example.com', 2),
(7,  'careworker03', '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-1421-1241', 'careworker03@example.com', 2),
(8,  'guardian01',   '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-8888-4884', 'guardian01@example.com',   1),
(9,  'guardian02',   '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-8282-9898', 'guardian02@example.com',   1),
(10, 'guardian03',   '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-4124-1241', 'guardian03@example.com',   1);

INSERT IGNORE INTO `user` (user_no, user_id, user_password, phone_number, email, user_category_no) VALUES
(11, 'careworker05', '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-2001-0005', 'careworker05@example.com', 2),
(12, 'careworker06', '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-2001-0006', 'careworker06@example.com', 2),
(13, 'careworker07', '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-2001-0007', 'careworker07@example.com', 2),
(14, 'careworker08', '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-2001-0008', 'careworker08@example.com', 2),
(15, 'careworker09', '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-2001-0009', 'careworker09@example.com', 2),
(16, 'careworker10', '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-2001-0010', 'careworker10@example.com', 2),
(17, 'careworker11', '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.', '010-2001-0011', 'careworker11@example.com', 2);

-- 4. 보호자
INSERT IGNORE INTO guardians (guardian_no, user_no, guardian_name, guardian_relationship) VALUES
(1, 8,  '김민수', '아들'),
(2, 9,  '이지영', '딸'),
(3, 10, '박정호', '아들');

-- 5. 요양보호사 (latitude, longitude 포함)
INSERT IGNORE INTO careworkers
(careworker_no, careworker_name, careworker_address, careworker_gender, hour_wage, careworker_age, careworker_state, latitude, longitude, center_no, user_no, sign_state) VALUES
(1, '정미숙', '경기도 안양시 동안구 비산동',   '여자', 13000, 58, '근무중', 37.4000, 126.9470, 1, 5, '승인완료'),
(2, '김영희', '경기도 시흥시 능곡동',         '여자', 13500, 55, '근무중', 37.3620, 126.8010, 2, 6, '승인완료'),
(3, '박성호', '경기도 수원시 팔달구 인계동',   '남자', 14000, 58, '근무중', 37.2650, 127.0300, 3, 7, '승인완료');

INSERT IGNORE INTO careworkers
(careworker_no, careworker_name, careworker_address, careworker_gender, hour_wage, careworker_age, careworker_state, latitude, longitude, center_no, user_no, sign_state) VALUES
(4,  '이순옥', '경기도 안양시 만안구 석수동', '여자', 12500, 54, '근무중', 37.4290, 126.9010, 1, 11, '승인완료'),
(5,  '최영수', '경기도 안양시 동안구 관양동', '남자', 13000, 60, '근무중', 37.3920, 126.9650, 1, 12, '승인완료'),
(6,  '한미경', '경기도 시흥시 정왕동',       '여자', 12800, 49, '근무중', 37.3490, 126.7430, 2, 13, '승인완료'),
(7,  '오정자', '경기도 시흥시 장곡동',       '여자', 13200, 57, '근무중', 37.4580, 126.7800, 2, 14, '승인완료'),
(8,  '신혜진', '경기도 수원시 권선구 세류동', '여자', 12700, 45, '근무중', 37.2530, 127.0150, 3, 15, '승인완료'),
(9,  '류재호', '경기도 수원시 영통구 영통동', '남자', 13800, 52, '근무중', 37.2510, 127.0710, 3, 16, '승인완료'),
(10, '문경애', '경기도 수원시 장안구 파장동', '여자', 13400, 59, '근무중', 37.3050, 126.9900, 3, 17, '승인완료');

-- 6. 수급자 (latitude, longitude 포함)
INSERT IGNORE INTO carerecipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content, latitude, longitude) VALUES
(1,  1, '김영자', 82, '경기도 안양시 동안구 평촌동',   '여자', '보행 시 지팡이 사용',     37.3900, 126.9640),
(2,  1, '이순자', 87, '경기도 안양시 동안구 호계동',   '여자', '청력이 다소 좋지 않음',   37.3760, 126.9540),
(3,  1, '박영수', 79, '경기도 안양시 만안구 안양동',   '남자', '당뇨 식단 관리 필요',     37.4000, 126.9230),
(4,  2, '최정숙', 84, '경기도 시흥시 능곡동',         '여자', '무릎 관절 불편',          37.3620, 126.8010),
(5,  2, '이복희', 81, '경기도 시흥시 장곡동',         '여자', '복약 시간 확인 필요',     37.4600, 126.7790),
(6,  2, '강영호', 77, '경기도 시흥시 배곧동',         '남자', '주 3회 산책 희망',        37.3700, 126.7280),
(7,  3, '윤정자', 86, '경기도 수원시 팔달구 인계동',   '여자', '계단 이동이 어려움',      37.2650, 127.0300),
(8,  3, '박철수', 80, '경기도 수원시 권선구 권선동',   '남자', '식사 준비 도움 필요',     37.2530, 126.9900),
(9,  3, '송복자', 83, '경기도 수원시 영통구 매탄동',   '여자', '장시간 보행 어려움',      37.2530, 127.0450),
(10, 3, '임영길', 78, '경기도 수원시 장안구 정자동',   '남자', '정기적인 혈압 확인 필요', 37.3010, 127.0100);

-- 7. 서비스 요청 (시간은 시 단위)
INSERT IGNORE INTO requests
(request_no, preferred_gender, request_state, visit_date, visit_start_time, visit_end_time, request_content, carerecipient_no) VALUES
(1,  '여자', '완료', '2026-09-14',  9, 13, '식사 준비 및 주변 정리',     1),
(2,  '무관', '완료', '2026-09-15', 15, 19, '병원 방문 동행',            2),
(3,  '여자', '취소', '2026-09-17', 10, 14, '목욕 및 가사 지원',         3),
(4,  '여자', '완료', '2026-09-14',  9, 13, '식사 및 청소 지원',         4),
(5,  '무관', '완료', '2026-09-16', 14, 18, '산책 및 말벗',              5),
(6,  '여자', '완료', '2026-09-18', 10, 16, '복약 확인 및 주변 정리',     6),
(7,  '남자', '완료', '2026-09-23', 13, 17, '식사 지원 및 말벗',         7),
(8,  '남자', '완료', '2026-09-24',  9, 13, '병원 이동 및 외출 동행',     8),
(9,  '무관', '완료', '2026-09-25', 15, 18, '말벗 및 가사 지원',         9),
(10, '여자', '신청', '2026-09-30', 10, 12, '복약 확인 및 식사 지원',    10);

INSERT IGNORE INTO requests
(request_no, preferred_gender, request_state, visit_date, visit_start_time, visit_end_time, request_content, carerecipient_no) VALUES
(11, '여자', '신청',     '2026-10-08',  9, 13, '식사 준비 및 청소 지원',     1),
(12, '무관', '신청',     '2026-10-08', 14, 18, '병원 방문 동행',            2),
(13, '남자', '신청',     '2026-10-09', 10, 12, '목욕 및 이동 보조',         3),
(14, '무관', '신청',     '2026-10-10',  9, 12, '산책 및 말벗',              4),
(15, '여자', '신청',     '2026-10-12', 13, 17, '복약 확인 및 식사 지원',     7),
(16, '무관', '배정중',   '2026-10-09', 14, 18, '장보기 및 가사 지원',        5),
(17, '여자', '배정완료', '2026-10-10', 10, 14, '주변 정리 및 식사 지원',     9);

-- 8. 근무 기록
INSERT IGNORE INTO careworkersreport
(careworkers_report_no, work_date, work_start_time, work_end_time, work_status, careworker_no, request_no) VALUES
(1, '2026-09-14',  9, 13, '완료', 1, 1),
(2, '2026-09-15', 15, 19, '완료', 1, 2),
(3, '2026-09-17', 10, 14, '취소', 1, 3),
(4, '2026-09-14',  9, 13, '완료', 2, 4),
(5, '2026-09-16', 14, 18, '완료', 2, 5),
(6, '2026-09-18', 10, 16, '완료', 2, 6),
(7, '2026-09-23', 13, 17, '완료', 3, 7),
(8, '2026-09-24',  9, 13, '완료', 3, 8),
(9, '2026-09-25', 15, 18, '완료', 3, 9);

INSERT IGNORE INTO careworkersreport
(careworkers_report_no, work_date, work_start_time, work_end_time, work_status, careworker_no, request_no) VALUES
(10, '2026-10-09', 14, 18, '배정', 6, 16),
(11, '2026-10-10', 10, 14, '확정', 8, 17);

-- 9. 문의 카테고리
INSERT IGNORE INTO inquirycategory (inquiry_category_no, inquiry_category_name) VALUES
(1, '방문 시간 변경 요청'),
(2, '방문 요일 변경 요청'),
(3, '담당자 관련 문의'),
(4, '기타 문의');

-- 근무 가능 시간 (요양보호사 번호는 caregiver_no)
INSERT IGNORE INTO caregiveravailability
(availability_no, available_date, start_time, end_time, status, caregiver_no) VALUES
(1,  '2026-09-30',  9, 18, '근무가능', 1),
(2,  '2026-09-30',  9, 18, '근무가능', 2),
(3,  '2026-09-30',  9, 18, '근무가능', 3),
(4,  '2026-10-08',  9, 18, '근무가능', 1),
(5,  '2026-10-08',  9, 18, '근무가능', 4),
(6,  '2026-10-08',  9, 14, '근무가능', 5),
(7,  '2026-10-08', 13, 19, '근무가능', 2),
(8,  '2026-10-08',  9, 18, '근무가능', 6),
(9,  '2026-10-09',  9, 18, '근무가능', 3),
(10, '2026-10-09',  9, 18, '근무가능', 9),
(11, '2026-10-09', 10, 16, '근무가능', 5),
(12, '2026-10-09', 13, 19, '근무가능', 7),
(13, '2026-10-10',  9, 18, '근무가능', 1),
(14, '2026-10-10',  9, 18, '근무가능', 4),
(15, '2026-10-10',  9, 15, '근무가능', 10),
(16, '2026-10-10',  9, 18, '근무가능', 8),
(17, '2026-10-12',  9, 18, '근무가능', 8),
(18, '2026-10-12', 12, 18, '근무가능', 10),
(19, '2026-10-12',  9, 18, '근무가능', 3),
(20, '2026-10-08', 10, 15, '휴무',     7);

-- 보호자 문의
INSERT IGNORE INTO guardianinquiry
(inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content, create_date, update_date) VALUES
(1, 1, 1, '2026-10-08', 10, 14, '방문 시간을 오전 10시로 옮기고 싶습니다.',         '2026-10-05 09:10:00', '2026-10-05 09:10:00'),
(2, 2, 2, '2026-10-09', 14, 18, '다음 주 방문 요일을 목요일로 바꿀 수 있을까요?',   '2026-10-05 11:20:00', '2026-10-05 11:20:00'),
(3, 3, 3, NULL, NULL, NULL,      '담당 요양보호사를 여자 분으로 바꿔 주세요.',         '2026-10-04 15:40:00', '2026-10-04 15:40:00'),
(4, 1, 4, NULL, NULL, NULL,      '방문 후 일지는 어디서 확인하나요?',                  '2026-10-04 17:00:00', '2026-10-04 17:00:00'),
(5, 2, 1, '2026-10-10', 9, 13,   '병원 일정 때문에 시간을 앞당기고 싶습니다.',        '2026-10-06 08:30:00', '2026-10-06 08:30:00'),
(6, 3, 2, '2026-10-12', 13, 17,  '요일을 월요일에서 화요일로 변경 요청합니다.',       '2026-10-06 10:05:00', '2026-10-06 10:05:00');

-- 10. 이미 DB 에 들어 있는 샘플 행은 INSERT IGNORE 로 건너뛰므로 좌표만 따로 맞춘다.
UPDATE careworkers SET latitude = 37.4000, longitude = 126.9470 WHERE careworker_no = 1 AND latitude = 0 AND longitude = 0;
UPDATE careworkers SET latitude = 37.3620, longitude = 126.8010 WHERE careworker_no = 2 AND latitude = 0 AND longitude = 0;
UPDATE careworkers SET latitude = 37.2650, longitude = 127.0300 WHERE careworker_no = 3 AND latitude = 0 AND longitude = 0;
UPDATE carerecipients SET latitude = 37.3900, longitude = 126.9640 WHERE carerecipient_no = 1  AND latitude = 0 AND longitude = 0;
UPDATE carerecipients SET latitude = 37.3760, longitude = 126.9540 WHERE carerecipient_no = 2  AND latitude = 0 AND longitude = 0;
UPDATE carerecipients SET latitude = 37.4000, longitude = 126.9230 WHERE carerecipient_no = 3  AND latitude = 0 AND longitude = 0;
UPDATE carerecipients SET latitude = 37.3620, longitude = 126.8010 WHERE carerecipient_no = 4  AND latitude = 0 AND longitude = 0;
UPDATE carerecipients SET latitude = 37.4600, longitude = 126.7790 WHERE carerecipient_no = 5  AND latitude = 0 AND longitude = 0;
UPDATE carerecipients SET latitude = 37.3700, longitude = 126.7280 WHERE carerecipient_no = 6  AND latitude = 0 AND longitude = 0;
UPDATE carerecipients SET latitude = 37.2650, longitude = 127.0300 WHERE carerecipient_no = 7  AND latitude = 0 AND longitude = 0;
UPDATE carerecipients SET latitude = 37.2530, longitude = 126.9900 WHERE carerecipient_no = 8  AND latitude = 0 AND longitude = 0;
UPDATE carerecipients SET latitude = 37.2530, longitude = 127.0450 WHERE carerecipient_no = 9  AND latitude = 0 AND longitude = 0;
UPDATE carerecipients SET latitude = 37.3010, longitude = 127.0100 WHERE carerecipient_no = 10 AND latitude = 0 AND longitude = 0;
UPDATE careworkers SET latitude = 37.4290, longitude = 126.9010 WHERE careworker_no = 4 AND latitude = 0 AND longitude = 0;
UPDATE careworkers SET latitude = 37.3920, longitude = 126.9650 WHERE careworker_no = 5 AND latitude = 0 AND longitude = 0;
UPDATE careworkers SET latitude = 37.3490, longitude = 126.7430 WHERE careworker_no = 6 AND latitude = 0 AND longitude = 0;
UPDATE careworkers SET latitude = 37.4580, longitude = 126.7800 WHERE careworker_no = 7 AND latitude = 0 AND longitude = 0;
UPDATE careworkers SET latitude = 37.2530, longitude = 127.0150 WHERE careworker_no = 8 AND latitude = 0 AND longitude = 0;
UPDATE careworkers SET latitude = 37.2510, longitude = 127.0710 WHERE careworker_no = 9 AND latitude = 0 AND longitude = 0;
UPDATE careworkers SET latitude = 37.3050, longitude = 126.9900 WHERE careworker_no = 10 AND latitude = 0 AND longitude = 0;
