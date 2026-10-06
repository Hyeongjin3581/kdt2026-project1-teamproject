-- 샘플 데이터 (테이블은 JPA 엔티티가 생성하므로 INSERT 만 작성)
-- INSERT IGNORE : 이미 같은 번호가 있으면 건너뛰어 재시작해도 오류가 나지 않는다.
-- 위도/경도는 추천(거리 점수) 계산에 쓰이므로 동 단위 대략 좌표를 함께 넣는다.
-- 비밀번호는 모두 같은 BCrypt 해시이다.

-- 1. 사용자 카테고리
INSERT IGNORE INTO usercategory (user_category_no, user_category_name) VALUES
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

-- 4. 보호자
INSERT IGNORE INTO guardians (guardian_no, user_no, guardian_name, guardian_relationship) VALUES
(1, 8,  '김민수', '아들'),
(2, 9,  '이지영', '딸'),
(3, 10, '박정호', '아들');

-- 5. 요양보호사 (latitude, longitude 포함)
INSERT IGNORE INTO careworkers
(careworker_no, careworker_name, careworker_address, careworker_gender, hour_wage, careworker_age, careworker_state, latitude, longitude, center_no, user_no) VALUES
(1, '정미숙', '경기도 안양시 동안구 비산동',   '여자', 13000, 58, '근무중', 37.4000, 126.9470, 1, 5),
(2, '김영희', '경기도 시흥시 능곡동',         '여자', 13500, 55, '근무중', 37.3620, 126.8010, 2, 6),
(3, '박성호', '경기도 수원시 팔달구 인계동',   '남자', 14000, 58, '근무중', 37.2650, 127.0300, 3, 7);

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

-- 9. 문의 카테고리
INSERT IGNORE INTO inquirycategory (inquiry_category_no, inquiry_category_name) VALUES
(1, '방문 시간 변경 요청'),
(2, '방문 요일 변경 요청'),
(3, '담당자 관련 문의'),
(4, '기타 문의');

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
