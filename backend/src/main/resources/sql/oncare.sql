-- 문의 카테고리
UPDATE inquiry_category
SET inquiry_category_name = '기타 문의'
WHERE inquiry_category_no = 4 AND inquiry_category_name = '서비스 이용 문의';
INSERT INTO inquiry_category (inquiry_category_no, inquiry_category_name)
SELECT 1, '방문 시간 변경 요청'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM inquiry_category WHERE inquiry_category_no = 1);
INSERT INTO inquiry_category (inquiry_category_no, inquiry_category_name)
SELECT 2, '방문 요일 변경 요청'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM inquiry_category WHERE inquiry_category_no = 2);
INSERT INTO inquiry_category (inquiry_category_no, inquiry_category_name)
SELECT 3, '담당자 관련 문의'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM inquiry_category WHERE inquiry_category_no = 3);
INSERT INTO inquiry_category (inquiry_category_no, inquiry_category_name)
SELECT 4, '기타 문의'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM inquiry_category WHERE inquiry_category_no = 4);

-- 보호자 계정: guardians.user_no 외래 키를 위한 시드 데이터
INSERT INTO usercategory (user_category_no, user_category_name)
SELECT 1, '보호자'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM usercategory WHERE user_category_no = 1);
INSERT INTO usercategory (user_category_no, user_category_name)
SELECT 2, '요양보호사'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM usercategory WHERE user_category_no = 2);
INSERT INTO usercategory (user_category_no, user_category_name)
SELECT 3, '센터 관리자'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM usercategory WHERE user_category_no = 3);
INSERT INTO usercategory (user_category_no, user_category_name)
SELECT 4, '시스템 관리자'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM usercategory WHERE user_category_no = 4);

UPDATE user
SET user_id = 'admin4', user_password = '1q2w3e4r!', phone_number = '010-1234-5678', email = 'admin01@example.com', user_category_no = 4
WHERE user_no = 1 AND user_id = 'sample_guardian_01';
INSERT INTO user (user_no, user_id, user_password, phone_number, email, user_category_no)
SELECT 1, 'admin4', '1q2w3e4r!', '010-1234-5678', 'admin01@example.com', 4
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM user WHERE user_no = 1);
UPDATE user
SET user_id = 'apfhd77', user_password = 'gimozzi1', phone_number = '010-1235-1235', email = 'center01@example.com', user_category_no = 3
WHERE user_no = 2 AND user_id = 'sample_guardian_02';
INSERT INTO user (user_no, user_id, user_password, phone_number, email, user_category_no)
SELECT 2, 'apfhd77', 'gimozzi1', '010-1235-1235', 'center01@example.com', 3
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM user WHERE user_no = 2);
UPDATE user
SET user_id = 'wjdgudwls', user_password = 'qkqh11', phone_number = '010-1010-1010', email = 'center02@example.com', user_category_no = 3
WHERE user_no = 3 AND user_id = 'sample_guardian_03';
INSERT INTO user (user_no, user_id, user_password, phone_number, email, user_category_no)
SELECT 3, 'wjdgudwls', 'qkqh11', '010-1010-1010', 'center02@example.com', 3
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM user WHERE user_no = 3);
UPDATE user
SET user_id = 'gusals1', user_password = '1234', phone_number = '010-0987-6543', email = 'center03@example.com', user_category_no = 3
WHERE user_no = 4 AND user_id = 'sample_guardian_04';
INSERT INTO user (user_no, user_id, user_password, phone_number, email, user_category_no)
SELECT 4, 'gusals1', '1234', '010-0987-6543', 'center03@example.com', 3
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM user WHERE user_no = 4);
UPDATE user
SET user_id = 'wjdgudwlsdlqslek', user_password = 'qzz', phone_number = '010-8766-2342', email = 'careworker01@example.com', user_category_no = 2
WHERE user_no = 5 AND user_id = 'sample_guardian_05';
INSERT INTO user (user_no, user_id, user_password, phone_number, email, user_category_no)
SELECT 5, 'wjdgudwlsdlqslek', 'qzz', '010-8766-2342', 'careworker01@example.com', 2
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM user WHERE user_no = 5);
INSERT INTO user (user_no, user_id, user_password, phone_number, email, user_category_no)
SELECT 6, 'dbstjd33', 'faker1557', '010-1557-1557', 'careworker02@example.com', 2
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM user WHERE user_no = 6);
INSERT INTO user (user_no, user_id, user_password, phone_number, email, user_category_no)
SELECT 7, 'chovygoat', 'chovy88848', '010-1421-1241', 'careworker03@example.com', 2
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM user WHERE user_no = 7);
INSERT INTO user (user_no, user_id, user_password, phone_number, email, user_category_no)
SELECT 8, 'guardian02', 'guard2222', '010-8888-4884', 'guardian01@example.com', 1
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM user WHERE user_no = 8);
INSERT INTO user (user_no, user_id, user_password, phone_number, email, user_category_no)
SELECT 9, 'guardian03', 'guard3333', '010-8282-9898', 'guardian02@example.com', 1
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM user WHERE user_no = 9);
INSERT INTO user (user_no, user_id, user_password, phone_number, email, user_category_no)
SELECT 10, 'guardian04', 'guard4444', '010-4124-1241', 'guardian03@example.com', 1
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM user WHERE user_no = 10);

-- 보호자
UPDATE guardians
SET user_no = 8, guardian_name = '김민수', guardian_relationship = '아들'
WHERE guardian_no = 1 AND user_no = 1 AND guardian_name = '김민수';
INSERT INTO guardians (guardian_no, user_no, guardian_name, guardian_relationship)
SELECT 1, 8, '김민수', '아들'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardians WHERE guardian_no = 1);
UPDATE guardians
SET user_no = 9, guardian_name = '이지영', guardian_relationship = '딸'
WHERE guardian_no = 2 AND user_no = 2 AND guardian_name = '이서연';
INSERT INTO guardians (guardian_no, user_no, guardian_name, guardian_relationship)
SELECT 2, 9, '이지영', '딸'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardians WHERE guardian_no = 2);
UPDATE guardians
SET user_no = 10, guardian_name = '박정호', guardian_relationship = '아들'
WHERE guardian_no = 3 AND user_no = 3 AND guardian_name = '박지훈';
INSERT INTO guardians (guardian_no, user_no, guardian_name, guardian_relationship)
SELECT 3, 10, '박정호', '아들'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardians WHERE guardian_no = 3);

-- 돌봄 대상자
UPDATE care_recipients
SET guardian_no = 1, carerecipient_name = '김영자', carerecipient_age = 82, carerecipient_address = '경기도 안양시 동안구 평촌동', carerecipient_gender = '여자', care_recipient_content = '보행 시 지팡이 사용'
WHERE carerecipient_no = 1 AND carerecipient_name = '김영자';
INSERT INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
SELECT 1, 1, '김영자', 82, '경기도 안양시 동안구 평촌동', '여자', '보행 시 지팡이 사용'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM care_recipients WHERE carerecipient_no = 1);
UPDATE care_recipients
SET guardian_no = 1, carerecipient_name = '이순자', carerecipient_age = 87, carerecipient_address = '경기도 안양시 동안구 호계동', carerecipient_gender = '여자', care_recipient_content = '청력이 다소 좋지 않음'
WHERE carerecipient_no = 2 AND carerecipient_name = '이동수';
INSERT INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
SELECT 2, 1, '이순자', 87, '경기도 안양시 동안구 호계동', '여자', '청력이 다소 좋지 않음'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM care_recipients WHERE carerecipient_no = 2);
UPDATE care_recipients
SET guardian_no = 1, carerecipient_name = '박영수', carerecipient_age = 79, carerecipient_address = '경기도 안양시 만안구 안양동', carerecipient_gender = '남자', care_recipient_content = '당뇨 식단 관리 필요'
WHERE carerecipient_no = 3 AND carerecipient_name = '박순희';
INSERT INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
SELECT 3, 1, '박영수', 79, '경기도 안양시 만안구 안양동', '남자', '당뇨 식단 관리 필요'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM care_recipients WHERE carerecipient_no = 3);
UPDATE care_recipients
SET guardian_no = 2, carerecipient_name = '최정숙', carerecipient_age = 84, carerecipient_address = '경기도 시흥시 능곡동', carerecipient_gender = '여자', care_recipient_content = '무릎 관절 불편'
WHERE carerecipient_no = 4 AND carerecipient_name = '최정호';
INSERT INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
SELECT 4, 2, '최정숙', 84, '경기도 시흥시 능곡동', '여자', '무릎 관절 불편'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM care_recipients WHERE carerecipient_no = 4);
UPDATE care_recipients
SET guardian_no = 2, carerecipient_name = '이복희', carerecipient_age = 81, carerecipient_address = '경기도 시흥시 장곡동', carerecipient_gender = '여자', care_recipient_content = '복약 시간 확인 필요'
WHERE carerecipient_no = 5 AND carerecipient_name = '정복례';
INSERT INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
SELECT 5, 2, '이복희', 81, '경기도 시흥시 장곡동', '여자', '복약 시간 확인 필요'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM care_recipients WHERE carerecipient_no = 5);
INSERT INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
SELECT 6, 2, '강영호', 77, '경기도 시흥시 배곧동', '남자', '주 3회 산책 희망'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM care_recipients WHERE carerecipient_no = 6);
INSERT INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
SELECT 7, 3, '윤정자', 86, '경기도 수원시 팔달구 인계동', '여자', '계단 이동이 어려움'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM care_recipients WHERE carerecipient_no = 7);
INSERT INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
SELECT 8, 3, '박철수', 80, '경기도 수원시 권선구 권선동', '남자', '식사 준비 도움 필요'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM care_recipients WHERE carerecipient_no = 8);
INSERT INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
SELECT 9, 3, '송복자', 83, '경기도 수원시 영통구 매탄동', '남자', '장시간 보행 어려움'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM care_recipients WHERE carerecipient_no = 9);
INSERT INTO care_recipients (carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
SELECT 10, 3, '임영길', 78, '경기도 수원시 장안구 정자동', '남자', '정기적인 혈압 확인 필요'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM care_recipients WHERE carerecipient_no = 10);

-- 보호자 문의
UPDATE guardian_inquiry
SET guardian_no = 1, inquiry_category_no = 1, wish_date = '2026-09-28', wish_start_time = 1000, wish_end_time = NULL, inquiry_content = '방문 시간을 오전 10시로 변경 요청합니다.'
WHERE inquiry_no = 1 AND inquiry_content = '방문 시간을 오전으로 변경할 수 있을까요?';
INSERT INTO guardian_inquiry (inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
SELECT 1, 1, 1, '2026-09-28', 1000, NULL, '방문 시간을 오전 10시로 변경 요청합니다.'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_no = 1);
UPDATE guardian_inquiry
SET guardian_no = 2, inquiry_category_no = 2, wish_date = '2026-09-29', wish_start_time = 900, wish_end_time = NULL, inquiry_content = '방문 요일 변경 요청입니다.'
WHERE inquiry_no = 2 AND inquiry_content = '방문 요일을 화요일로 변경하고 싶습니다.';
INSERT INTO guardian_inquiry (inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
SELECT 2, 2, 2, '2026-09-29', 900, NULL, '방문 요일 변경 요청입니다.'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_no = 2);
INSERT INTO guardian_inquiry (inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
SELECT 3, 3, 3, NULL, NULL, NULL, '담당 요양보호사와 상담을 요청합니다.'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_no = 3);
UPDATE guardian_inquiry
SET guardian_no = 1, inquiry_category_no = 4, wish_date = NULL, wish_start_time = NULL, wish_end_time = NULL, inquiry_content = '기타 문의 사항이 있습니다.'
WHERE inquiry_no = 4 AND guardian_no = 4;
INSERT INTO guardian_inquiry (inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
SELECT 4, 1, 4, NULL, NULL, NULL, '기타 문의 사항이 있습니다.'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_no = 4);
UPDATE guardian_inquiry
SET guardian_no = 2, inquiry_category_no = 1, wish_date = '2026-09-30', wish_start_time = 1100, wish_end_time = NULL, inquiry_content = '방문 시간을 오전 11시로 변경 요청합니다.'
WHERE inquiry_no = 5 AND inquiry_category_no = 5;
INSERT INTO guardian_inquiry (inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
SELECT 5, 2, 1, '2026-09-30', 1100, NULL, '방문 시간을 오전 11시로 변경 요청합니다.'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_no = 5);
INSERT INTO guardian_inquiry (inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
SELECT 6, 3, 2, '2026-10-01', 1400, NULL, '방문 요일 변경 요청입니다.'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_no = 6);
INSERT INTO guardian_inquiry (inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
SELECT 7, 1, 3, NULL, NULL, NULL, '담당자 관련 문의가 있습니다.'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_no = 7);
INSERT INTO guardian_inquiry (inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
SELECT 8, 2, 4, NULL, NULL, NULL, '기타 문의 사항이 있습니다.'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_no = 8);
INSERT INTO guardian_inquiry (inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
SELECT 9, 3, 1, '2026-10-02', 1000, NULL, '방문 시간을 오전 10시로 변경 요청합니다.'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_no = 9);
INSERT INTO guardian_inquiry (inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
SELECT 10, 1, 2, '2026-10-03', 900, NULL, '방문 요일 변경 요청입니다.'
FROM (SELECT 1 AS seed) AS source
WHERE NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_no = 10);

DELETE FROM guardians
WHERE guardian_no = 4 AND user_no = 4 AND guardian_name = '최유진';
DELETE FROM guardians
WHERE guardian_no = 5 AND user_no = 5 AND guardian_name = '정하늘';
DELETE FROM inquiry_category
WHERE inquiry_category_no = 5
	AND NOT EXISTS (SELECT 1 FROM guardian_inquiry WHERE inquiry_category_no = 5);
