-- =========================================================
-- 온케어 스케줄 - 구글시트 "DB 샘플링" 기준 CREATE TABLE
-- (시트에 적힌 테이블·속성명·타입 그대로. 실행 오류 나는 부분만 최소 수정, 주석 표시)
-- =========================================================

DROP DATABASE IF EXISTS oncare;
CREATE DATABASE oncare DEFAULT CHARACTER SET utf8mb4;
USE oncare;

-- 유저 카테고리
CREATE TABLE usercategory (
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
    start_time TIME NULL,
    end_time TIME NULL,
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
    FOREIGN KEY (guardian_no) REFERENCES guardians (guardian_no),
    FOREIGN KEY (inquiry_category_no) REFERENCES inquiry_category (inquiry_category_no)
);