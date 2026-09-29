-- 문의 카테고리
INSERT IGNORE INTO inquiry_category (inquiry_category_no, inquiry_category_name) VALUES
(1, '방문 시간 변경 요청'),
(2, '방문 요일 변경 요청'),
(3, '담당자 관련 문의'),
(4, '서비스 이용 문의'),
(5, '기타 문의');

-- 보호자 계정: guardians.user_no 필수 외래 키를 위한 시드 데이터
INSERT IGNORE INTO usercategory (user_category_no, user_category_name) VALUES
(1, '보호자');

INSERT IGNORE INTO `user` (user_no, user_id, user_password, phone_number, email, user_category_no) VALUES
(1, 'sample_guardian_01', 'sample-password-01', '010-2000-0001', 'guardian01@example.com', 1),
(2, 'sample_guardian_02', 'sample-password-02', '010-2000-0002', 'guardian02@example.com', 1),
(3, 'sample_guardian_03', 'sample-password-03', '010-2000-0003', 'guardian03@example.com', 1),
(4, 'sample_guardian_04', 'sample-password-04', '010-2000-0004', 'guardian04@example.com', 1),
(5, 'sample_guardian_05', 'sample-password-05', '010-2000-0005', 'guardian05@example.com', 1);

-- 보호자
INSERT IGNORE INTO guardians (guardian_no, user_no, guardian_name, guardian_relationship) VALUES
(1, 1, '김민수', '아들'),
(2, 2, '이서연', '딸'),
(3, 3, '박지훈', '배우자'),
(4, 4, '최유진', '며느리'),
(5, 5, '정하늘', '조카');

-- 돌봄 대상자
INSERT IGNORE INTO care_recipients
	(carerecipient_no, guardian_no, carerecipient_name, carerecipient_age, carerecipient_address, carerecipient_gender, care_recipient_content)
VALUES
(1, 1, '김영자', 82, '서울특별시 마포구 월드컵로 10', '여성', '보행 시 지팡이를 사용합니다.'),
(2, 2, '이동수', 76, '서울특별시 성북구 동소문로 20', '남성', '식사 준비와 복약 확인이 필요합니다.'),
(3, 3, '박순희', 88, '경기도 고양시 일산동구 중앙로 30', '여성', '실내 이동을 도와주세요.'),
(4, 4, '최정호', 79, '인천광역시 연수구 센트럴로 40', '남성', '오전 시간대 돌봄을 선호합니다.'),
(5, 5, '정복례', 85, '경기도 부천시 원미구 길주로 50', '여성', '말벗과 가벼운 산책이 필요합니다.');

-- 보호자 문의
INSERT IGNORE INTO guardian_inquiry
	(inquiry_no, guardian_no, inquiry_category_no, wish_date, wish_start_time, wish_end_time, inquiry_content)
VALUES
(1, 1, 1, '2026-10-05', 900, 1100, '방문 시간을 오전으로 변경할 수 있을까요?'),
(2, 2, 2, '2026-10-06', 1000, 1200, '방문 요일을 화요일로 변경하고 싶습니다.'),
(3, 3, 3, NULL, NULL, NULL, '담당 요양보호사와 상담을 요청합니다.'),
(4, 4, 4, NULL, NULL, NULL, '서비스 이용 절차를 안내해 주세요.'),
(5, 5, 5, NULL, NULL, NULL, '추가 문의 사항이 있어 연락 부탁드립니다.');
