-- Active: 1785826856181@@127.0.0.1@3306@oncare
-- =========================================================
-- =========================================================
-- ONCARE 통합 DB + 샘플 데이터
-- MySQL / Spring Boot / Talend API Tester 테스트용
-- 자동매칭 결과 테이블 제외
--
-- 샘플 사용자 비밀번호
-- 평문 : 1234
-- BCrypt : $2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.
-- =========================================================

-- DB를 삭제하지 않고, 없을 때만 생성합니다.
CREATE DATABASE IF NOT EXISTS oncare;
USE oncare;


/*-- 기존 camelCase/구 테이블이 있을 때만 Entity 테이블명으로 이전합니다.
SET @oncare_migration = IF(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'usercategory')
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_category'),
    'RENAME TABLE usercategory TO user_category',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'careRecipients')
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'care_recipients'),
    'RENAME TABLE careRecipients TO care_recipients',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'caregiverAvailability')
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'caregiver_availability'),
    'RENAME TABLE caregiverAvailability TO caregiver_availability',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

*/

-- =========================================================
-- 1. 사용자 카테고리
-- =========================================================

CREATE TABLE IF NOT EXISTS user_category (
    user_category_no INT NOT NULL AUTO_INCREMENT,
    user_category_name VARCHAR(50) NOT NULL,

    PRIMARY KEY (user_category_no)
);



-- =========================================================
-- 2. 센터
-- =========================================================

CREATE TABLE IF NOT EXISTS center (
    center_no INT NOT NULL AUTO_INCREMENT,
    center_name VARCHAR(50) NOT NULL,
    center_address VARCHAR(255) NOT NULL,
    center_phonenumber VARCHAR(20) NOT NULL,

    PRIMARY KEY (center_no)
);



-- =========================================================
-- 3. 사용자
-- =========================================================

CREATE TABLE IF NOT EXISTS `user` (
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
        REFERENCES user_category(user_category_no)
);



-- =========================================================
-- 4. 보호자
-- =========================================================

CREATE TABLE IF NOT EXISTS guardians (
    guardian_no INT NOT NULL AUTO_INCREMENT,
    user_no INT NOT NULL UNIQUE,
    guardian_name VARCHAR(10) NOT NULL,
    guardian_relationship VARCHAR(20) NOT NULL,
    create_date DATETIME NULL,
    update_date DATETIME NULL,

    PRIMARY KEY (guardian_no),

    FOREIGN KEY (user_no)
        REFERENCES `user`(user_no)
);

-- =========================================================
-- 5. 수급자
-- =========================================================

CREATE TABLE IF NOT EXISTS care_recipients (
    carerecipient_no INT NOT NULL AUTO_INCREMENT,
    guardian_no INT NULL,
    carerecipient_name VARCHAR(50) NOT NULL,
    carerecipient_age INT NOT NULL,
    carerecipient_address VARCHAR(255) NOT NULL,
    carerecipient_gender CHAR(2) NOT NULL,
    care_recipient_content VARCHAR(255),
    create_date DATETIME NULL,
    update_date DATETIME NULL,

    PRIMARY KEY (carerecipient_no),

    FOREIGN KEY (guardian_no)
        REFERENCES guardians(guardian_no)
);



-- =========================================================
-- 6. 요양보호사
-- =========================================================

CREATE TABLE IF NOT EXISTS careworkers (
    careworker_no INT NOT NULL AUTO_INCREMENT,
    careworker_name VARCHAR(50) NOT NULL,
    careworker_address VARCHAR(255) NOT NULL,
    careworker_gender CHAR(2) NOT NULL,
    hour_wage INT NOT NULL,
    careworker_age INT NOT NULL,
    careworker_state VARCHAR(10) NOT NULL,
    center_no INT NOT NULL,
    user_no INT NOT NULL UNIQUE,

    PRIMARY KEY (careworker_no),

    FOREIGN KEY (center_no)
        REFERENCES center(center_no),

    FOREIGN KEY (user_no)
        REFERENCES `user`(user_no)
);



-- =========================================================
-- 7. 요양보호사 근무 가능 시간
-- =========================================================

CREATE TABLE IF NOT EXISTS caregiver_availability (
    availability_no INT NOT NULL AUTO_INCREMENT,
    caregiver_no INT NOT NULL,
    available_date DATE NOT NULL,
    start_time INT NOT NULL,
    end_time INT NOT NULL,
    status VARCHAR(20) NOT NULL,

    PRIMARY KEY (availability_no),

    FOREIGN KEY (caregiver_no)
        REFERENCES careworkers(careworker_no)
);



-- =========================================================
-- 8. 매칭 서비스 요청
-- =========================================================

CREATE TABLE IF NOT EXISTS requests (
    request_no INT NOT NULL AUTO_INCREMENT,
    carerecipient_no INT NOT NULL,
    preferred_gender VARCHAR(5),
    request_state VARCHAR(20) NOT NULL,
    visit_date DATE NOT NULL,
    visit_start_time TIME NOT NULL,
    visit_end_time TIME NOT NULL,
    request_content VARCHAR(255),
    request_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (request_no),

    FOREIGN KEY (carerecipient_no)
        REFERENCES care_recipients(carerecipient_no)
);



-- =========================================================
-- 9. 요양보호사 근무 기록
-- =========================================================

CREATE TABLE IF NOT EXISTS careworkersreport (
    careworkers_report_no INT NOT NULL AUTO_INCREMENT,
    careworker_no INT NOT NULL,
    request_no INT NOT NULL,
    work_date DATE NOT NULL,
    work_start_time TIME NOT NULL,
    work_end_time TIME NOT NULL,
    work_status VARCHAR(50) NOT NULL,

    PRIMARY KEY (careworkers_report_no),

    FOREIGN KEY (careworker_no)
        REFERENCES careworkers(careworker_no),

    FOREIGN KEY (request_no)
        REFERENCES requests(request_no)
);



-- =========================================================
-- 10. 문의 카테고리
-- =========================================================

CREATE TABLE IF NOT EXISTS inquiry_category (
    inquiry_category_no INT NOT NULL AUTO_INCREMENT,
    inquiry_category_name VARCHAR(50) NOT NULL,

    PRIMARY KEY (inquiry_category_no)
);



-- =========================================================
-- 11. 보호자 문의
-- =========================================================

CREATE TABLE IF NOT EXISTS guardian_inquiry (
    inquiry_no INT NOT NULL AUTO_INCREMENT,
    guardian_no INT NOT NULL,
    inquiry_category_no INT NOT NULL,
    wish_date DATE NULL,
    wish_start_time TIME NULL,
    wish_end_time TIME NULL,
    inquiry_content VARCHAR(1000),
    create_date DATETIME NULL,
    update_date DATETIME NULL,

    PRIMARY KEY (inquiry_no),

    FOREIGN KEY (guardian_no)
        REFERENCES guardians(guardian_no),

    FOREIGN KEY (inquiry_category_no)
        REFERENCES inquiry_category(inquiry_category_no)
);

-- 기존 테이블에는 CREATE TABLE IF NOT EXISTS가 컬럼을 추가하지 않으므로 누락 컬럼만 보정합니다.
SET @oncare_migration = IF(
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user' AND column_name = 'email'),
    'ALTER TABLE `user` ADD COLUMN email VARCHAR(100) NULL',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    (SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user' AND column_name = 'user_password') < 255,
    'ALTER TABLE `user` MODIFY COLUMN user_password VARCHAR(255) NOT NULL',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'user' AND index_name = 'uk_user_email'),
    'ALTER TABLE `user` ADD UNIQUE KEY uk_user_email (email)',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'requests' AND column_name = 'request_created_at'),
    'ALTER TABLE requests ADD COLUMN request_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'guardians' AND column_name = 'create_date'),
    'ALTER TABLE guardians ADD COLUMN create_date DATETIME NULL',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'guardians' AND column_name = 'update_date'),
    'ALTER TABLE guardians ADD COLUMN update_date DATETIME NULL',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'care_recipients' AND column_name = 'careRecipient_content')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'care_recipients' AND column_name = 'care_recipient_content'),
    'ALTER TABLE care_recipients CHANGE COLUMN careRecipient_content care_recipient_content VARCHAR(255) NULL',
    IF(
        NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'care_recipients' AND column_name = 'care_recipient_content'),
        'ALTER TABLE care_recipients ADD COLUMN care_recipient_content VARCHAR(255) NULL',
        'SELECT 1'
    )
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'care_recipients' AND column_name = 'create_date'),
    'ALTER TABLE care_recipients ADD COLUMN create_date DATETIME NULL',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'care_recipients' AND column_name = 'update_date'),
    'ALTER TABLE care_recipients ADD COLUMN update_date DATETIME NULL',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'guardian_inquiry' AND column_name = 'create_date'),
    'ALTER TABLE guardian_inquiry ADD COLUMN create_date DATETIME NULL',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'guardian_inquiry' AND column_name = 'update_date'),
    'ALTER TABLE guardian_inquiry ADD COLUMN update_date DATETIME NULL',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;



-- =========================================================
-- =========================================================
-- 구 테이블과 새 테이블이 모두 있으면 기존 레코드도 새 테이블로 합칩니다.
SET @oncare_migration = IF(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'usercategory')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_category'),
    'INSERT IGNORE INTO user_category (user_category_no, user_category_name) SELECT user_category_no, user_category_name FROM usercategory',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'caregiverAvailability')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'caregiver_availability'),
    'INSERT IGNORE INTO caregiver_availability (availability_no, caregiver_no, available_date, start_time, end_time, status) SELECT availability_no, caregiver_no, available_date, start_time, end_time, status FROM caregiverAvailability',
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

SET @oncare_migration = IF(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'careRecipients')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'care_recipients'),
    IF(
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'careRecipients' AND column_name = 'careRecipient_content'),
        'INSERT IGNORE INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content) SELECT carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, careRecipient_content FROM careRecipients',
        'INSERT IGNORE INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content) SELECT carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content FROM careRecipients'
    ),
    'SELECT 1'
);
PREPARE oncare_migration_stmt FROM @oncare_migration;
EXECUTE oncare_migration_stmt;
DEALLOCATE PREPARE oncare_migration_stmt;

-- 샘플 데이터 시작
-- =========================================================
-- =========================================================



-- =========================================================
-- 1. 사용자 카테고리 샘플
-- =========================================================

INSERT IGNORE INTO user_category
(user_category_no, user_category_name)
VALUES
(1, '보호자');

INSERT IGNORE INTO user_category
(user_category_no, user_category_name)
VALUES
(2, '요양보호사');

INSERT IGNORE INTO user_category
(user_category_no, user_category_name)
VALUES
(3, '센터 관리자');

INSERT IGNORE INTO user_category
(user_category_no, user_category_name)
VALUES
(4, '시스템 관리자');



-- =========================================================
-- 2. 센터 샘플
-- =========================================================

INSERT IGNORE INTO center
(center_no, center_name, center_address, center_phonenumber)
VALUES
(1, '안양 온케어 방문요양센터',
 '경기도 안양시 동안구 시민대로 180',
 '031-380-1001');

INSERT IGNORE INTO center
(center_no, center_name, center_address, center_phonenumber)
VALUES
(2, '시흥 온케어 방문요양센터',
 '경기도 시흥시 능곡로 120',
 '031-310-2001');

INSERT IGNORE INTO center
(center_no, center_name, center_address, center_phonenumber)
VALUES
(3, '수원 온케어 방문요양센터',
 '경기도 수원시 팔달구 효원로 250',
 '031-240-3001');



-- =========================================================
-- 3. 사용자 샘플
-- 비밀번호 전부 1234
-- =========================================================

INSERT IGNORE INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(
    1,
    'admin01',
    '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.',
    4,
    '010-1234-5678',
    'admin01@example.com'
);

INSERT IGNORE INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(
    2,
    'center01',
    '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.',
    3,
    '010-1235-1235',
    'center01@example.com'
);

INSERT IGNORE INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(
    3,
    'center02',
    '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.',
    3,
    '010-1010-1010',
    'center02@example.com'
);

INSERT IGNORE INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(
    4,
    'center03',
    '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.',
    3,
    '010-0987-6543',
    'center03@example.com'
);

INSERT IGNORE INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(
    5,
    'careworker01',
    '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.',
    2,
    '010-8766-2342',
    'careworker01@example.com'
);

INSERT IGNORE INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(
    6,
    'careworker02',
    '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.',
    2,
    '010-1557-1557',
    'careworker02@example.com'
);

INSERT IGNORE INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(
    7,
    'careworker03',
    '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.',
    2,
    '010-1421-1241',
    'careworker03@example.com'
);

INSERT IGNORE INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(
    8,
    'guardian01',
    '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.',
    1,
    '010-8888-4884',
    'guardian01@example.com'
);

INSERT IGNORE INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(
    9,
    'guardian02',
    '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.',
    1,
    '010-8282-9898',
    'guardian02@example.com'
);

INSERT IGNORE INTO `user`
(user_no, user_id, user_password, user_category_no, phone_number, email)
VALUES
(
    10,
    'guardian03',
    '$2a$10$69bMrChodVYxOcvM/cUo7evsho3hw6YBJT9yepHudwBlIvi7KlV0.',
    1,
    '010-4124-1241',
    'guardian03@example.com'
);



-- =========================================================
-- 4. 보호자 샘플
-- =========================================================

INSERT IGNORE INTO guardians
(guardian_no, user_no, guardian_name, guardian_relationship)
VALUES
(1, 8, '김민수', '아들');

INSERT IGNORE INTO guardians
(guardian_no, user_no, guardian_name, guardian_relationship)
VALUES
(2, 9, '이지영', '딸');

INSERT IGNORE INTO guardians
(guardian_no, user_no, guardian_name, guardian_relationship)
VALUES
(3, 10, '박정호', '아들');



-- =========================================================
-- 5. 수급자 샘플
-- =========================================================

INSERT IGNORE INTO care_recipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age,
 carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(1, 1, '김영자', 82,
 '경기도 안양시 동안구 평촌동', '여자',
 '보행 시 지팡이 사용');

INSERT IGNORE INTO care_recipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age,
 carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(2, 1, '이순자', 87,
 '경기도 안양시 동안구 호계동', '여자',
 '청력이 다소 좋지 않음');

INSERT IGNORE INTO care_recipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age,
 carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(3, 1, '박영수', 79,
 '경기도 안양시 만안구 안양동', '남자',
 '당뇨 식단 관리 필요');

INSERT IGNORE INTO care_recipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age,
 carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(4, 2, '최정숙', 84,
 '경기도 시흥시 능곡동', '여자',
 '무릎 관절 불편');

INSERT IGNORE INTO care_recipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age,
 carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(5, 2, '이복희', 81,
 '경기도 시흥시 장곡동', '여자',
 '복약 시간 확인 필요');

INSERT IGNORE INTO care_recipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age,
 carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(6, 2, '강영호', 77,
 '경기도 시흥시 배곧동', '남자',
 '주 3회 산책 희망');

INSERT IGNORE INTO care_recipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age,
 carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(7, 3, '윤정자', 86,
 '경기도 수원시 팔달구 인계동', '여자',
 '계단 이동이 어려움');

INSERT IGNORE INTO care_recipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age,
 carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(8, 3, '박철수', 80,
 '경기도 수원시 권선구 권선동', '남자',
 '식사 준비 도움 필요');

INSERT IGNORE INTO care_recipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age,
 carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(9, 3, '송복자', 83,
 '경기도 수원시 영통구 매탄동', '여자',
 '장시간 보행 어려움');

INSERT IGNORE INTO care_recipients
(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age,
 carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(10, 3, '임영길', 78,
 '경기도 수원시 장안구 정자동', '남자',
 '정기적인 혈압 확인 필요');



-- =========================================================
-- 6. 요양보호사 샘플
-- =========================================================

INSERT IGNORE INTO careworkers
(careworker_no, careworker_name, careworker_address,
 careworker_gender, hour_wage, careworker_age,
 careworker_state, center_no, user_no)
VALUES
(
    1,
    '정미숙',
    '경기도 안양시 동안구 비산동',
    '여자',
    13000,
    58,
    '근무중',
    1,
    5
);

INSERT IGNORE INTO careworkers
(careworker_no, careworker_name, careworker_address,
 careworker_gender, hour_wage, careworker_age,
 careworker_state, center_no, user_no)
VALUES
(
    2,
    '김영희',
    '경기도 시흥시 능곡동',
    '여자',
    13500,
    55,
    '근무중',
    2,
    6
);

INSERT IGNORE INTO careworkers
(careworker_no, careworker_name, careworker_address,
 careworker_gender, hour_wage, careworker_age,
 careworker_state, center_no, user_no)
VALUES
(
    3,
    '박성호',
    '경기도 수원시 팔달구 인계동',
    '남자',
    14000,
    58,
    '근무중',
    3,
    7
);



-- =========================================================
-- 7. 요양보호사 근무가능시간
-- =========================================================

INSERT IGNORE INTO caregiver_availability
(availability_no, caregiver_no, available_date,
 start_time, end_time, status)
VALUES
(1, 1, '2026-09-28', '09:00:00', '18:00:00', '근무가능');

INSERT IGNORE INTO caregiver_availability
(availability_no, caregiver_no, available_date,
 start_time, end_time, status)
VALUES
(2, 1, '2026-09-29', '09:00:00', '15:00:00', '근무가능');

INSERT IGNORE INTO caregiver_availability
(availability_no, caregiver_no, available_date,
 start_time, end_time, status)
VALUES
(3, 1, '2026-09-30', '10:00:00', '18:00:00', '근무가능');

INSERT IGNORE INTO caregiver_availability
(availability_no, caregiver_no, available_date,
 start_time, end_time, status)
VALUES
(4, 2, '2026-09-28', '08:00:00', '17:00:00', '근무가능');

INSERT IGNORE INTO caregiver_availability
(availability_no, caregiver_no, available_date,
 start_time, end_time, status)
VALUES
(5, 2, '2026-09-29', '08:00:00', '17:00:00', '근무가능');

INSERT IGNORE INTO caregiver_availability
(availability_no, caregiver_no, available_date,
 start_time, end_time, status)
VALUES
(6, 2, '2026-09-30', '09:00:00', '14:00:00', '근무가능');

INSERT IGNORE INTO caregiver_availability
(availability_no, caregiver_no, available_date,
 start_time, end_time, status)
VALUES
(7, 3, '2026-09-28', '13:00:00', '18:00:00', '근무가능');

INSERT IGNORE INTO caregiver_availability
(availability_no, caregiver_no, available_date,
 start_time, end_time, status)
VALUES
(8, 3, '2026-09-29', '09:00:00', '18:00:00', '근무가능');

INSERT IGNORE INTO caregiver_availability
(availability_no, caregiver_no, available_date,
 start_time, end_time, status)
VALUES
(9, 3, '2026-09-30', '09:00:00', '18:00:00', '근무가능');

INSERT IGNORE INTO caregiver_availability
(availability_no, caregiver_no, available_date,
 start_time, end_time, status)
VALUES
(10, 3, '2026-10-01', NULL, NULL, '휴무');



-- =========================================================
-- 8. 서비스 요청
-- =========================================================

INSERT IGNORE INTO requests
(request_no, carerecipient_no, preferred_gender,
 request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(
    1, 1, '여자', '완료',
    '2026-09-14', '09:00:00', '13:00:00',
    '식사 준비 및 주변 정리',
    '2026-09-10 09:00:00'
);

INSERT IGNORE INTO requests
(request_no, carerecipient_no, preferred_gender,
 request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(
    2, 2, '무관', '완료',
    '2026-09-15', '15:00:00', '19:00:00',
    '병원 방문 동행',
    '2026-09-10 09:10:00'
);

INSERT IGNORE INTO requests
(request_no, carerecipient_no, preferred_gender,
 request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(
    3, 3, '여자', '취소',
    '2026-09-17', '10:00:00', '14:00:00',
    '목욕 및 가사 지원',
    '2026-09-11 10:00:00'
);

INSERT IGNORE INTO requests
(request_no, carerecipient_no, preferred_gender,
 request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(
    4, 4, '여자', '완료',
    '2026-09-14', '09:00:00', '13:30:00',
    '식사 및 청소 지원',
    '2026-09-10 11:00:00'
);

INSERT IGNORE INTO requests
(request_no, carerecipient_no, preferred_gender,
 request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(
    5, 5, '무관', '완료',
    '2026-09-16', '14:30:00', '18:00:00',
    '산책 및 말벗',
    '2026-09-11 11:00:00'
);

INSERT IGNORE INTO requests
(request_no, carerecipient_no, preferred_gender,
 request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(
    6, 6, '여자', '완료',
    '2026-09-18', '10:00:00', '16:00:00',
    '복약 확인 및 주변 정리',
    '2026-09-12 09:00:00'
);

INSERT IGNORE INTO requests
(request_no, carerecipient_no, preferred_gender,
 request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(
    7, 7, '남자', '완료',
    '2026-09-23', '13:00:00', '17:00:00',
    '식사 지원 및 말벗',
    '2026-09-19 09:00:00'
);

INSERT IGNORE INTO requests
(request_no, carerecipient_no, preferred_gender,
 request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(
    8, 8, '남자', '완료',
    '2026-09-24', '09:00:00', '13:00:00',
    '병원 이동 및 외출 동행',
    '2026-09-19 09:10:00'
);

INSERT IGNORE INTO requests
(request_no, carerecipient_no, preferred_gender,
 request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(
    9, 9, '무관', '완료',
    '2026-09-25', '15:00:00', '18:00:00',
    '말벗 및 가사 지원',
    '2026-09-20 10:00:00'
);

INSERT IGNORE INTO requests
(request_no, carerecipient_no, preferred_gender,
 request_state, visit_date, visit_start_time,
 visit_end_time, request_content, request_created_at)
VALUES
(
    10, 10, '여자', '신청',
    '2026-09-30', '10:00:00', '12:00:00',
    '복약 확인 및 식사 지원',
    '2026-09-28 10:00:00'
);



-- =========================================================
-- 9. 요양보호사 과거 근무기록
-- =========================================================

INSERT IGNORE INTO careworkersreport
(careworkers_report_no, careworker_no, request_no,
 work_date, work_start_time, work_end_time, work_status)
VALUES
(1, 1, 1, '2026-09-14', '09:00:00', '13:00:00', '완료');

INSERT IGNORE INTO careworkersreport
(careworkers_report_no, careworker_no, request_no,
 work_date, work_start_time, work_end_time, work_status)
VALUES
(2, 1, 2, '2026-09-15', '15:00:00', '19:00:00', '완료');

INSERT IGNORE INTO careworkersreport
(careworkers_report_no, careworker_no, request_no,
 work_date, work_start_time, work_end_time, work_status)
VALUES
(3, 1, 3, '2026-09-17', '10:00:00', '14:00:00', '취소');

INSERT IGNORE INTO careworkersreport
(careworkers_report_no, careworker_no, request_no,
 work_date, work_start_time, work_end_time, work_status)
VALUES
(4, 2, 4, '2026-09-14', '09:00:00', '13:30:00', '완료');

INSERT IGNORE INTO careworkersreport
(careworkers_report_no, careworker_no, request_no,
 work_date, work_start_time, work_end_time, work_status)
VALUES
(5, 2, 5, '2026-09-16', '14:30:00', '18:00:00', '완료');

INSERT IGNORE INTO careworkersreport
(careworkers_report_no, careworker_no, request_no,
 work_date, work_start_time, work_end_time, work_status)
VALUES
(6, 2, 6, '2026-09-18', '10:00:00', '16:00:00', '완료');

INSERT IGNORE INTO careworkersreport
(careworkers_report_no, careworker_no, request_no,
 work_date, work_start_time, work_end_time, work_status)
VALUES
(7, 3, 7, '2026-09-23', '13:00:00', '17:00:00', '완료');

INSERT IGNORE INTO careworkersreport
(careworkers_report_no, careworker_no, request_no,
 work_date, work_start_time, work_end_time, work_status)
VALUES
(8, 3, 8, '2026-09-24', '09:00:00', '13:00:00', '완료');

INSERT IGNORE INTO careworkersreport
(careworkers_report_no, careworker_no, request_no,
 work_date, work_start_time, work_end_time, work_status)
VALUES
(9, 3, 9, '2026-09-25', '15:00:00', '18:00:00', '완료');



-- =========================================================
-- 10. 문의 카테고리
-- =========================================================

INSERT IGNORE INTO inquiry_category
(inquiry_category_no, inquiry_category_name)
VALUES
(1, '방문 시간 변경 요청');

INSERT IGNORE INTO inquiry_category
(inquiry_category_no, inquiry_category_name)
VALUES
(2, '방문 요일 변경 요청');

INSERT IGNORE INTO inquiry_category
(inquiry_category_no, inquiry_category_name)
VALUES
(3, '담당자 관련 문의');

INSERT IGNORE INTO inquiry_category
(inquiry_category_no, inquiry_category_name)
VALUES
(4, '기타 문의');



-- =========================================================
-- 11. 보호자 문의
-- =========================================================

INSERT IGNORE INTO guardian_inquiry
(inquiry_no, guardian_no, inquiry_category_no,
 wish_date, wish_start_time, wish_end_time, inquiry_content)
VALUES
(
    1,
    1,
    1,
    '2026-09-30', '13:00:00', '15:00:00',
    '기존 오전 방문을 오후 1시부터 3시로 변경하고 싶습니다.'
);

INSERT IGNORE INTO guardian_inquiry
(inquiry_no, guardian_no, inquiry_category_no,
 wish_date, wish_start_time, wish_end_time, inquiry_content)
VALUES
(
    2,
    2,
    2,
    '2026-10-01', '10:00:00', '12:00:00',
    '수요일 방문을 목요일 오전으로 변경하고 싶습니다.'
);

INSERT IGNORE INTO guardian_inquiry
(inquiry_no, guardian_no, inquiry_category_no,
 wish_date, wish_start_time, wish_end_time, inquiry_content)
VALUES
(
    3,
    3,
    3,
    NULL,
    NULL,
    NULL,
    '현재 담당 요양보호사 변경이 가능한지 문의드립니다.'
);

INSERT IGNORE INTO guardian_inquiry
(inquiry_no, guardian_no, inquiry_category_no,
 wish_date, wish_start_time, wish_end_time, inquiry_content)
VALUES
(
    4,
    1,
    4,
    NULL,
    NULL,
    NULL,
    '방문요양 서비스 이용 비용 관련 문의드립니다.'
);



-- =========================================================
-- 12. 데이터 확인
-- =========================================================

SELECT * FROM user_category;

SELECT * FROM center;

SELECT * FROM `user`;

SELECT * FROM guardians;

SELECT * FROM care_recipients;

SELECT * FROM careworkers;

SELECT * FROM caregiver_availability;

SELECT * FROM requests;

SELECT * FROM careworkersreport;

SELECT * FROM inquiry_category;

SELECT * FROM guardian_inquiry;