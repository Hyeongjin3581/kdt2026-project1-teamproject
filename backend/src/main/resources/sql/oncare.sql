-- ONCARE 새 DB 생성 + 샘플 데이터 (MySQL 8.0.16 이상)
-- 용도: MySQL Workbench/SQLTools 등에서 빈 DB에 한 번 실행하는 개발용 스크립트.
-- 전체를 같은 연결에서 실행하고, 오류가 발생하면 중단하세요.
-- 기존 테이블이 있으면 CREATE TABLE에서 오류가 나므로 그대로 이어서 실행하지 마세요.
-- 기존 oncare를 완전히 지우고 다시 만들 때만 아래 DROP 줄의 주석을 해제하세요.
-- 주석을 해제하면 oncare의 모든 테이블과 데이터가 삭제됩니다.
-- DROP DATABASE IF EXISTS oncare;

CREATE DATABASE IF NOT EXISTS oncare
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE oncare;
SET NAMES utf8mb4;
SET SESSION time_zone = '+09:00';

-- 날짜 기준을 실행 시작 시 한 번 고정합니다.
SET @oncare_today = CURRENT_DATE();
SET @oncare_next_monday = DATE_ADD(
    @oncare_today, INTERVAL (7 - WEEKDAY(@oncare_today)) DAY
);
-- 모든 샘플 계정의 비밀번호: 1234 (BCrypt 해시)
SET @oncare_sample_password = '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.';

-- 시간 규칙: INT 값 900 = 09:00, 1330 = 13:30, 0 = 00:00.
-- 방문/근무가능/근무기록/문의 희망시간은 Integer 엔티티·DTO 기준 INT(HHMM 표현)입니다.
-- SQL 타입명은 INT이며 HHMM은 저장 규칙입니다. 초 단위는 저장하지 않습니다.
-- 날짜는 DATE, 생성/수정일시는 DATETIME입니다.
-- 본 샘플의 방문/근무는 같은 날짜 안에서 시작 < 종료인 경우를 다룹니다.
-- HHMM 숫자를 직접 빼면 분 차이가 아닙니다. 계산 시 (값 DIV 100)*60 + MOD(값,100)을 사용하세요.
-- CHECK 제약조건은 960, 1260, 2400 등 잘못된 HHMM을 차단합니다.


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

-- 센터 샘플

INSERT INTO center
(center_no, center_name, center_address, center_phonenumber)
VALUES
(1, '안양 온케어 방문요양센터', '경기도 안양시 동안구 시민대로 180', '031-380-1001');

INSERT INTO center
(center_no, center_name, center_address, center_phonenumber)
VALUES
(2, '시흥 온케어 방문요양센터', '경기도 시흥시 능곡로 120', '031-310-2001');

INSERT INTO center
(center_no, center_name, center_address, center_phonenumber)
VALUES
(3, '수원 온케어 방문요양센터', '경기도 수원시 팔달구 효원로 250', '031-240-3001');

-- 사용자 샘플

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(1, 'admin01', @oncare_sample_password, 4, '010-1234-5678', 'admin01@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(2, 'center01', @oncare_sample_password, 3, '010-1235-1235', 'center01@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(3, 'center02', @oncare_sample_password, 3, '010-1010-1010', 'center02@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(4, 'center03', @oncare_sample_password, 3, '010-0987-6543', 'center03@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(5, 'careworker01', @oncare_sample_password, 2, '010-8766-2342', 'careworker01@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(6, 'careworker02', @oncare_sample_password, 2, '010-1557-1557', 'careworker02@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(7, 'careworker03', @oncare_sample_password, 2, '010-1421-1241', 'careworker03@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(8, 'guardian01', @oncare_sample_password, 1, '010-8888-4884', 'guardian01@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(9, 'guardian02', @oncare_sample_password, 1, '010-8282-9898', 'guardian02@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(10, 'guardian03', @oncare_sample_password, 1, '010-4124-1241', 'guardian03@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(11, 'careworker04', @oncare_sample_password, 2, '010-0000-0004', 'careworker04@example.com');

INSERT INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(12, 'careworker05', @oncare_sample_password, 2, '010-0000-0005', 'careworker05@example.com'),
(13, 'careworker06', @oncare_sample_password, 2, '010-0000-0006', 'careworker06@example.com'),
(14, 'careworker07', @oncare_sample_password, 2, '010-0000-0007', 'careworker07@example.com'),
(15, 'careworker08', @oncare_sample_password, 2, '010-0000-0008', 'careworker08@example.com'),
(16, 'careworker09', @oncare_sample_password, 2, '010-0000-0009', 'careworker09@example.com');

-- 보호자 샘플

INSERT INTO guardians
(guardian_no, user_no, guardian_name, guardian_relationship)
VALUES
(1, 8, '김민수', '아들');

INSERT INTO guardians
(guardian_no, user_no, guardian_name, guardian_relationship)
VALUES
(2, 9, '이지영', '딸');

INSERT INTO guardians
(guardian_no, user_no, guardian_name, guardian_relationship)
VALUES
(3, 10, '박정호', '아들');

-- 수급자 샘플

INSERT INTO carerecipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address,
 carerecipient_gender, care_recipient_content, latitude, longitude)
VALUES
(1, 1, '김영자', 82, '경기도 안양시 동안구 시민대로 180', '여자', '추천 거리·근무횟수 테스트 수급자', 37.3926, 126.951),
(2, 1, '이순자', 87, '경기도 시흥시 능곡로 120', '여자', '추천 거리 테스트 수급자', 37.37, 126.806),
(3, 2, '박영수', 79, '경기도 수원시 팔달구 효원로 250', '남자', '추천 거리 테스트 수급자', 37.2636, 127.0286),
(4, 3, '최정숙', 84, '경기도 안양시 동안구 평촌대로 239', '여자', '추천 거리 테스트 수급자', 37.3902, 126.9634),
(5, 2, '이복희', 81, '경기도 시흥시 장곡동', '여자', '복약 시간 확인 필요', 0, 0),
(6, 2, '강영호', 77, '경기도 시흥시 배곧동', '남자', '주 3회 산책 희망', 0, 0),
(7, 3, '윤정자', 86, '경기도 수원시 팔달구 인계동', '여자', '계단 이동이 어려움', 0, 0),
(8, 3, '박철수', 80, '경기도 수원시 권선구 권선동', '남자', '식사 준비 도움 필요', 0, 0),
(9, 3, '송복자', 83, '경기도 수원시 영통구 매탄동', '여자', '장시간 보행 어려움', 0, 0),
(10, 3, '임영길', 78, '경기도 수원시 장안구 정자동', '남자', '정기적인 혈압 확인 필요', 0, 0);

-- 요양보호사 샘플

INSERT INTO careworkers
(careworker_no, careworker_name, careworker_address, careworker_gender, hour_wage,
 careworker_age, careworker_state, latitude, longitude, center_no, user_no)
VALUES
(1, '정미숙', '경기도 안양시 동안구 시민대로 155', '여자', 13000, 58, '근무중', 37.3914, 126.9497, 1, 5),
(2, '김영희', '경기도 시흥시 능곡로 143', '여자', 13500, 55, '근무중', 37.3690, 126.8082, 2, 6),
(3, '박성호', '경기도 수원시 팔달구 권광로 184', '남자', 14000, 58, '근무중', 37.2630, 127.0317, 3, 7),
(4, '최은희', '경기도 안양시 동안구 시민대로 245', '여자', 14500, 57, '근무중', 37.3940, 126.9560, 1, 11),
(5, '강민지', '경기도 안양시 동안구 평촌대로 212', '여자', 13000, 54, '근무중', 37.3920, 126.9605, 1, 12),
(6, '조현우', '경기도 시흥시 능곡로 178', '남자', 13500, 49, '근무중', 37.3668, 126.8065, 2, 13),
(7, '윤서연', '경기도 수원시 팔달구 권광로 173', '여자', 14000, 53, '근무중', 37.2633, 127.0309, 3, 14),
(8, '김도윤', '경기도 시흥시 승지로 60', '남자', 14500, 51, '근무중', 37.3635, 126.8120, 2, 15),
(9, '한지은', '경기도 수원시 팔달구 효원로 307', '여자', 15000, 56, '근무중', 37.2634, 127.0338, 3, 16);

-- 근무 가능 시간 샘플

INSERT INTO caregiveravailability
(availability_no, caregiver_no, available_date, start_time, end_time, status)
VALUES
(1, 1, @oncare_next_monday, 900, 1800, '근무가능'),
(2, 2, @oncare_next_monday, 800, 1700, '근무가능'),
(3, 3, @oncare_next_monday, 1300, 1800, '근무가능'),
(4, 4, @oncare_next_monday, 1000, 1600, '근무가능'),
(5, 5, DATE_ADD(@oncare_next_monday, INTERVAL 1 DAY), 900, 1500, '근무가능'),
(6, 6, DATE_ADD(@oncare_next_monday, INTERVAL 1 DAY), 1100, 1900, '근무가능'),
(7, 7, DATE_ADD(@oncare_next_monday, INTERVAL 2 DAY), 800, 1400, '근무가능'),
(8, 8, DATE_ADD(@oncare_next_monday, INTERVAL 2 DAY), 1300, 1900, '근무가능'),
(9, 9, DATE_ADD(@oncare_next_monday, INTERVAL 3 DAY), 900, 1700, '근무가능'),
(10, 3, DATE_ADD(@oncare_next_monday, INTERVAL 3 DAY), NULL, NULL, '휴무');

-- 방문 서비스 요청 샘플

-- 기본 요청 1~9는 최근 30일 집계에서 제외되도록 60일 전으로 설정합니다.
-- 추천 테스트: 완료 38건 + 취소 1건 + 진행중 1건 + 미래 완료 1건.
CREATE TEMPORARY TABLE oncarerecommendationtestseq (seq INT NOT NULL PRIMARY KEY);

INSERT INTO oncarerecommendationtestseq (seq) VALUES
(1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12), (13), (14), (15), (16), (17), (18), (19), (20), (21), (22), (23), (24), (25), (26), (27), (28), (29), (30), (31), (32), (33), (34), (35), (36), (37), (38), (39), (40), (41);

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(1, 1, '여자', '완료', DATE_SUB(@oncare_today, INTERVAL 60 DAY), 900, 1300, '식사 준비 및 주변 정리', DATE_SUB(@oncare_today, INTERVAL 64 DAY));

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(2, 2, '무관', '완료', DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1500, 1900, '병원 방문 동행', DATE_SUB(@oncare_today, INTERVAL 64 DAY));

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(3, 3, '여자', '취소', DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1000, 1400, '목욕 및 가사 지원', DATE_SUB(@oncare_today, INTERVAL 64 DAY));

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(4, 4, '여자', '완료', DATE_SUB(@oncare_today, INTERVAL 60 DAY), 900, 1330, '식사 및 청소 지원', DATE_SUB(@oncare_today, INTERVAL 64 DAY));

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(5, 5, '무관', '완료', DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1430, 1800, '산책 및 말벗', DATE_SUB(@oncare_today, INTERVAL 64 DAY));

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(6, 6, '여자', '완료', DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1000, 1600, '복약 확인 및 주변 정리', DATE_SUB(@oncare_today, INTERVAL 64 DAY));

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(7, 7, '남자', '완료', DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1300, 1700, '식사 지원 및 말벗', DATE_SUB(@oncare_today, INTERVAL 64 DAY));

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(8, 8, '남자', '완료', DATE_SUB(@oncare_today, INTERVAL 60 DAY), 900, 1300, '병원 이동 및 외출 동행', DATE_SUB(@oncare_today, INTERVAL 64 DAY));

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(9, 9, '무관', '완료', DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1500, 1800, '말벗 및 가사 지원', DATE_SUB(@oncare_today, INTERVAL 64 DAY));

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(10, 10, '여자', '신청', @oncare_next_monday, 1000, 1200, '복약 확인 및 식사 지원', CURRENT_TIMESTAMP);

INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
SELECT
1000 + seq,
    1,
    '무관',
    CASE WHEN seq = 39 THEN '취소' WHEN seq = 40 THEN '진행중' ELSE '완료' END,
    CASE WHEN seq = 41
        THEN DATE_ADD(@oncare_today, INTERVAL 1 DAY)
        ELSE DATE_SUB(@oncare_today, INTERVAL (seq % 30) DAY)
    END,
    900,
    1000,
    '거리·근무횟수 추천 테스트 방문',
    DATE_SUB(@oncare_today, INTERVAL 31 DAY)
FROM oncarerecommendationtestseq;

-- 좌표가 있는 수급자 1번의 다음 주 월요일 배정 테스트 요청입니다.
INSERT INTO requests
(request_no, carerecipient_no, preferred_gender, request_state, visit_date,
 visit_start_time, visit_end_time, request_content, request_created_at)
VALUES
(11, 1, '여자', '신청', @oncare_next_monday, 1000, 1200,
 '거리·근무횟수 기반 추천 및 배정 테스트', CURRENT_TIMESTAMP);

-- 근무 기록 샘플

-- 기본 기록은 요청 1~9에 연결합니다. 추천 테스트 기록은 요청 1001~1041에 연결합니다.

INSERT INTO careworkersreport
(careworkers_report_no, careworker_no, request_no, work_date, work_start_time, work_end_time,
 work_status)
VALUES
(1, 1, 1, DATE_SUB(@oncare_today, INTERVAL 60 DAY), 900, 1300, '완료'),
(2, 1, 2, DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1500, 1900, '완료'),
(3, 1, 3, DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1000, 1400, '취소'),
(4, 2, 4, DATE_SUB(@oncare_today, INTERVAL 60 DAY), 900, 1330, '완료'),
(5, 2, 5, DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1430, 1800, '완료'),
(6, 2, 6, DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1000, 1600, '완료'),
(7, 3, 7, DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1300, 1700, '완료'),
(8, 3, 8, DATE_SUB(@oncare_today, INTERVAL 60 DAY), 900, 1300, '완료'),
(9, 3, 9, DATE_SUB(@oncare_today, INTERVAL 60 DAY), 1500, 1800, '완료');

INSERT INTO careworkersreport
(careworkers_report_no, careworker_no, request_no, work_date, work_start_time, work_end_time,
 work_status)
SELECT
1000 + seq,
    CASE
        WHEN seq <= 3 OR seq = 39 THEN 1
        WHEN seq <= 8 OR seq = 40 THEN 2
        WHEN seq <= 18 OR seq = 41 THEN 3
        ELSE 4
    END,
    1000 + seq,
    CASE WHEN seq = 41
        THEN DATE_ADD(@oncare_today, INTERVAL 1 DAY)
        ELSE DATE_SUB(@oncare_today, INTERVAL (seq % 30) DAY)
    END,
    900,
    1000,
    CASE
        WHEN seq = 39 THEN '취소'
        WHEN seq = 40 THEN '진행중'
        ELSE '완료'
    END
FROM oncarerecommendationtestseq;

INSERT INTO careworkersreport
(careworkers_report_no, careworker_no, request_no, work_date, work_start_time, work_end_time,
 work_status)
VALUES
(1042, 1, 1001, DATE_SUB(@oncare_today, INTERVAL 1 DAY), 900, 1000, '완료');

DROP TEMPORARY TABLE oncarerecommendationtestseq;

-- 문의 카테고리 샘플

INSERT INTO inquirycategory
(inquiry_category_no, inquiry_category_name)
VALUES
(1, '방문 시간 변경 요청'),
(2, '방문 요일 변경 요청'),
(3, '담당자 관련 문의'),
(4, '기타 문의');

-- 보호자 문의 샘플

INSERT INTO guardianinquiry
(inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time,
 inquiry_content)
VALUES
(1, 1, 1, DATE_ADD(@oncare_next_monday, INTERVAL 2 DAY), 1300, 1500, '기존 오전 방문을 오후 1시부터 3시로 변경하고 싶습니다.' ),
(2, 2, 2, DATE_ADD(@oncare_next_monday, INTERVAL 3 DAY), 1000, 1200, '수요일 방문을 목요일 오전으로 변경하고 싶습니다.' ),
(3, 3, 3, NULL, NULL, NULL, '현재 담당 요양보호사 변경이 가능한지 문의드립니다.' ),
(4, 1, 4, NULL, NULL, NULL, '방문요양 서비스 이용 비용 관련 문의드립니다.');

COMMIT;

-- 확인 1: 테이블별 입력 건수
-- 기대값: 4 / 3 / 16 / 3 / 10 / 9 / 10 / 52 / 51 / 4 / 4
SELECT 'usercategory' AS table_name, COUNT(*) AS row_count FROM usercategory
UNION ALL SELECT 'center', COUNT(*) FROM center
UNION ALL SELECT 'user', COUNT(*) FROM `user`
UNION ALL SELECT 'guardians', COUNT(*) FROM guardians
UNION ALL SELECT 'carerecipients', COUNT(*) FROM carerecipients
UNION ALL SELECT 'careworkers', COUNT(*) FROM careworkers
UNION ALL SELECT 'caregiveravailability', COUNT(*) FROM caregiveravailability
UNION ALL SELECT 'requests', COUNT(*) FROM requests
UNION ALL SELECT 'careworkersreport', COUNT(*) FROM careworkersreport
UNION ALL SELECT 'inquirycategory', COUNT(*) FROM inquirycategory
UNION ALL SELECT 'guardianinquiry', COUNT(*) FROM guardianinquiry;

-- 확인 2: 실행 기준 오늘 포함 최근 30일 완료 방문 수
-- 보호사 1~9의 기대값: 3, 5, 10, 20, 0, 0, 0, 0, 0
-- 보고서 1042는 요청 1001의 중복 보고서로, COUNT(DISTINCT request_no)로 한 번만 집계합니다.
-- 취소/진행중/미래 기록은 제외합니다. 기간 경계: 오늘-29일 이상, 내일 미만.
SELECT cw.careworker_no, cw.careworker_name,
       COUNT(DISTINCT cr.request_no) AS completed_visit_count
FROM careworkers cw
LEFT JOIN careworkersreport cr
  ON cr.careworker_no = cw.careworker_no
 AND cr.work_status = '완료'
 AND cr.work_date >= DATE_SUB(@oncare_today, INTERVAL 29 DAY)
 AND cr.work_date < DATE_ADD(@oncare_today, INTERVAL 1 DAY)
GROUP BY cw.careworker_no, cw.careworker_name
ORDER BY cw.careworker_no;

-- 확인 3: Integer 엔티티와 맞춘 시간값
SELECT availability_no, available_date, start_time, end_time, status
FROM caregiveravailability ORDER BY availability_no;
SELECT request_no, visit_date, visit_start_time, visit_end_time, request_state
FROM requests WHERE request_no IN (1, 4, 5, 10, 11, 1001, 1039, 1040, 1041)
ORDER BY request_no;

-- 문의 희망시간도 Integer(HHMM) 값으로 확인합니다.
SELECT inquiry_no, wish_date, wish_start_time, wish_end_time
FROM guardianinquiry ORDER BY inquiry_no;

-- 참고: 이 파일은 수동 1회 생성용이므로 Spring 재시작 때마다 반복 실행하지 마세요.
-- 엔티티/DTO의 테이블·컬럼 매핑과 Integer 시간 타입을 대조한 개발용 샘플입니다.
-- CHECK 문법 기준: https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html
