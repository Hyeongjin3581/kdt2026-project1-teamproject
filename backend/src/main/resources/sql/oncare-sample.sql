-- 요양보호사 API 검증용 기본 더미데이터
-- 현재 oncare DB의 테이블이 생성된 상태에서 이 파일만 실행합니다.
-- 기존 oncare.sql에는 DROP DATABASE가 있으므로 더미데이터 추가용으로 실행하지 않습니다.
-- spring.sql.init.mode=never이므로 이 파일은 서버 시작 시 자동 실행되지 않습니다.
-- 같은 번호가 있으면 건너뜁니다. 기존 데이터를 삭제하거나 덮어쓰지 않습니다.
-- 이미 사용 중인 번호가 있다면 마지막 SELECT 결과를 확인하세요.

USE oncare;
SET NAMES utf8mb4;
START TRANSACTION;

-- 1. 사용자 카테고리: 사용자에서 참조하는 데이터
INSERT INTO usercategory (user_category_no, user_category_name)
SELECT 2, '요양보호사'
WHERE NOT EXISTS (
    SELECT 1 FROM usercategory WHERE user_category_no = 2
);

-- 2. 센터: 요양보호사가 소속될 센터
INSERT INTO center (center_no, center_name, center_address, center_phonenumber)
SELECT 1, '온케어 테스트센터', '안산시 테스트주소', '000-0000-0000'
WHERE NOT EXISTS (
    SELECT 1 FROM center WHERE center_no = 1
);

-- 3. 사용자: 4번은 조회용 요양보호사, 5번은 직접 POST 검증용, 6번은 추가 검증용
-- user_password는 로그인용이 아닌 더미 문자열입니다. 실제 계정정보가 아닙니다.
INSERT INTO `user` (user_no, user_id, user_password, user_category_no, phone_number)
SELECT 4, 'dummy_careworker_04', 'NOT_FOR_LOGIN', 2, '000-0000-0004'
WHERE NOT EXISTS (
    SELECT 1 FROM `user` WHERE user_no = 4 OR user_id = 'dummy_careworker_04'
);

INSERT INTO `user` (user_no, user_id, user_password, user_category_no, phone_number)
SELECT 5, 'dummy_careworker_05', 'NOT_FOR_LOGIN', 2, '000-0000-0005'
WHERE NOT EXISTS (
    SELECT 1 FROM `user` WHERE user_no = 5 OR user_id = 'dummy_careworker_05'
);

INSERT INTO `user` (user_no, user_id, user_password, user_category_no, phone_number)
SELECT 6, 'dummy_careworker_06', 'NOT_FOR_LOGIN', 2, '000-0000-0006'
WHERE NOT EXISTS (
    SELECT 1 FROM `user` WHERE user_no = 6 OR user_id = 'dummy_careworker_06'
);

-- 4. 조회용 요양보호사: userNo=5는 직접 등록 테스트를 위해 남겨 둡니다.
INSERT INTO careworkers (
    careworker_no, careworker_name, careworker_address, careworker_gender,
    hour_wage, careworker_age, careworker_state, center_no, user_no
)
SELECT 1, '김테스트', '안산시 테스트주소', '여', 12000, 50, '근무가능', 1, 4
WHERE NOT EXISTS (
    SELECT 1 FROM careworkers WHERE careworker_no = 1 OR user_no = 4
)
AND EXISTS (
    SELECT 1 FROM `user` WHERE user_no = 4 AND user_id = 'dummy_careworker_04'
);

COMMIT;

-- 실행 결과 확인: 비밀번호는 조회하지 않습니다.
SELECT user_category_no, user_category_name FROM usercategory;
SELECT center_no, center_name FROM center;
SELECT user_no, user_id, user_category_no FROM `user` WHERE user_no IN (4, 5, 6);
SELECT careworker_no, careworker_name, center_no, user_no FROM careworkers;

-- API 검증 순서
-- GET http://localhost:8080/api/careworkers
-- GET http://localhost:8080/api/careworkers/detail?careworkerNo=1
-- POST http://localhost:8080/api/careworkers
-- Content-Type: application/json
-- 아래 JSON을 API Tester의 Body에 입력합니다(SQL로 실행하는 부분이 아닙니다).
-- {
--   "careworkerName": "박영희",
--   "careworkerAddress": "안산시",
--   "careworkerGender": "여",
--   "hourWage": 13000,
--   "careworkerAge": 55,
--   "careworkerState": "근무가능",
--   "centerNo": 1,
--   "userNo": 5
-- }
-- POST 응답 true 확인 후 GET으로 생성된 careworkerNo를 확인합니다.
-- 동일한 POST를 반복하면 현재 서비스에서는 중복 등록될 수 있습니다.
ALTER TABLE oncare.caregiveravailability
    MODIFY COLUMN start_time INT NOT NULL,
    MODIFY COLUMN end_time INT NOT NULL;