/*-- =========================================================
-- 온케어 스케줄 - 구글시트 "DB 샘플링" 기준 CREATE TABLE
-- (시트에 적힌 테이블·속성명·타입 그대로. 실행 오류 나는 부분만 최소 수정, 주석 표시)
-- =========================================================

-- DROP DATABASE IF EXISTS oncare;
-- CREATE DATABASE oncare DEFAULT CHARACTER SET utf8mb4;
-- USE oncare;

-- 유저 카테고리
CREATE TABLE usercategory (
    user_category_no INT NOT NULL AUTO_INCREMENT,
    user_category_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_category_no)
);

-- 센터목록
CREATE TABLE center (
    center_no INT NOT NULL AUTO_INCREMENT,
    center_name VARCHAR(50) NOT NULL,
    center_address VARCHAR(255) NOT NULL,
    center_phonenumber VARCHAR(255) NOT NULL,
    PRIMARY KEY (center_no)
);

-- 사용자 목록
CREATE TABLE user (
    user_no INT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    user_password VARCHAR(50) NOT NULL,
    user_category_no INT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_no),
    FOREIGN KEY (user_category_no) REFERENCES usercategory (user_category_no)
);

-- 보호자테이블
CREATE TABLE guardians (
    guardian_no INT NOT NULL AUTO_INCREMENT,
    user_no INT NOT NULL UNIQUE,
    guardian_name VARCHAR(10) NOT NULL,
    guardian_relationship VARCHAR(20) NOT NULL,
    PRIMARY KEY (guardian_no),
    FOREIGN KEY (user_no) REFERENCES user (user_no)
);

-- 수급자테이블
CREATE TABLE careRecipients (
    carerecipient_no INT NOT NULL AUTO_INCREMENT,
    guardian_no INT NOT NULL,
    carerecipient_name VARCHAR(50) NOT NULL,
    carerecipient_age INT NOT NULL,
    carerecipient_address VARCHAR(255) NOT NULL, -- [수정] 시트: varchar (길이 없음 → 실행 오류)
    carerecipient_gender BOOLEAN NOT NULL,
    careRecipient_content VARCHAR(255) NULL,
    PRIMARY KEY (carerecipient_no),
    FOREIGN KEY (guardian_no) REFERENCES guardians (guardian_no)
);

-- 요양보호사목록
CREATE TABLE careworkers (
    careworker_no INT NOT NULL AUTO_INCREMENT,
    careworker_name VARCHAR(50) NOT NULL,
    careworker_address VARCHAR(255) NOT NULL,
    careworker_gender CHAR(2) NOT NULL,
    hour_wage INT NOT NULL,
    careworker_age INT NOT NULL,
    careworker_state VARCHAR(10) NOT NULL,
    center_no INT NOT NULL,
    user_no INT NOT NULL,
    PRIMARY KEY (careworker_no),
    FOREIGN KEY (center_no) REFERENCES center (center_no),
    FOREIGN KEY (user_no) REFERENCES user (user_no)
);

-- 다음주근무가능시간
CREATE TABLE caregiverAvailability (
    availability_no INT NOT NULL AUTO_INCREMENT,
    caregiver_no INT NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL,
    PRIMARY KEY (availability_no),
    FOREIGN KEY (caregiver_no) REFERENCES careworkers (careworker_no)
);

-- 매칭서비스요청
CREATE TABLE requests (
    request_no INT NOT NULL AUTO_INCREMENT,
    carerecipient_no INT NOT NULL,
    preferred_gender CHAR(5), -- [수정] 시트: boolean char(5) → 타입 하나만 가능해서 CHAR(5)
    request_state VARCHAR(20),
    visit_date DATE,
    visit_start_time TIME NOT NULL,
    visit_end_time TIME NOT NULL,
    request_content VARCHAR(255),
    PRIMARY KEY (request_no),
    FOREIGN KEY (carerecipient_no) REFERENCES careRecipients (carerecipient_no)
);

-- 요양보호사근무기록
CREATE TABLE careworkersreport (
    careworkers_report_no INT NOT NULL AUTO_INCREMENT,
    careworker_no INT NOT NULL,
    request_no INT NOT NULL,
    work_date DATE NOT NULL DEFAULT(CURRENT_DATE), -- 시트: 레코드 생성일 now()
    work_start_time TIME NOT NULL,
    work_end_time TIME NOT NULL,
    work_status VARCHAR(50) NOT NULL,
    PRIMARY KEY (careworkers_report_no),
    FOREIGN KEY (careworker_no) REFERENCES careworkers (careworker_no),
    FOREIGN KEY (request_no) REFERENCES requests (request_no)
);

-- 문의 카테고리  ([수정] 시트에 영문 테이블명 없음 → inquiry_category)
CREATE TABLE inquiry_category (
    inquiry_category_no INT NOT NULL AUTO_INCREMENT,
    user_category_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (inquiry_category_no)
);

-- 보호자문의  ([수정] 시트에 영문 테이블명 없음 → guardian_inquiry)
CREATE TABLE guardian_inquiry (
    inquiry_no INT NOT NULL AUTO_INCREMENT,
    guardian_no INT NOT NULL,
    inquiry_category_no INT NOT NULL, -- [수정] 시트: varchar(50) → 참조하는 PK가 INT라 FK 오류
    wish_date DATE NOT NULL,
    wish_start_time TIME,
    wish_end_time TIME,
    inquiry_content VARCHAR(1000),
    PRIMARY KEY (inquiry_no),
    FOREIGN KEY (guardian_no) REFERENCES guardians (guardian_no),
    FOREIGN KEY (inquiry_category_no) REFERENCES inquiry_category (inquiry_category_no)
);*/