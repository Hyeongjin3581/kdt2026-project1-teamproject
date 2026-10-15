-- 개발 DB용 공통 안내 seed. 자동 초기화 파일에 연결하지 않는다.
-- 기존 문의/답변/FAQ는 수정하지 않는다. 가상 원본 번호 대신 실제 신규 문의 PK를 추적한다.
-- 각 원본은 답변 완료 상태로 추가하므로 관리자 미응답 업무가 늘지 않는다.
-- 2026-10-15 검증 출처:
-- SCHEDULE/MULTI: oncare_frontend/src/features/guardian/request/GuardianRequest.jsx sendRequest()
-- HISTORY/EDIT: 같은 파일의 요청 내역, 수정 조건 + GuardianInquiryService.GuardianInquiryModify()
-- CAREGIVER: 같은 파일의 문의 유형/방문 선택/요청 보내기, DB inquirycategory 3
-- CONFIRM: GuardianInquiryService.GuardianInquiryAnswer(), applySchedule=true일 때만 일정 변경
-- 이 출처는 현재 개발 화면/처리 흐름에 대한 안내이며 센터 영업시간/가격/개별 승인 근거가 아니다.
-- 기존 공개 FAQ(원본 문의 11)의 방문 기록 안내는 그대로 보존한다.

START TRANSACTION;

INSERT INTO guardianinquiry
    (guardian_no,inquiry_category_no,inquiry_content,answer_content,answer_date,inquiry_group,create_date,update_date)
SELECT guardian.guardian_no,seed.category_no,seed.question,seed.answer,NOW(),seed.marker,NOW(),NOW()
FROM (
    SELECT 'AI-FAQ-SEED-V1-SCHEDULE' AS marker,1 AS category_no,
        '방문 시간이나 요일 변경은 어떻게 요청하나요?' AS question,
        '보호자 포털의 요청 · 문의에서 대상 방문 일정을 선택한 뒤 방문 시간 변경 요청 유형과 희망 날짜·시간, 내용을 입력하고 요청 보내기를 누르세요. 실제 변경 반영 여부는 담당 센터의 확인이 필요합니다.' AS answer
    UNION ALL SELECT 'AI-FAQ-SEED-V1-MULTI',1,
        '여러 날짜의 방문 시간 변경을 함께 요청할 수 있나요?',
        '방문 시간 변경 요청에서 희망 날짜를 여러 개 선택하고 날짜별 시작·종료 시간을 입력할 수 있습니다. 선택한 날짜별로 문의가 등록되며, 실제 변경 반영 여부는 담당 센터의 확인이 필요합니다.'
    UNION ALL SELECT 'AI-FAQ-SEED-V1-HISTORY',4,
        '보낸 문의의 답변은 어디에서 확인하나요?',
        '보호자 포털의 요청 · 문의 화면에서 요청 내역의 수급자를 선택하면 보낸 문의와 등록된 답변을 확인할 수 있습니다. 최신 내용은 문의 내역 새로고침으로 다시 조회해주세요.'
    UNION ALL SELECT 'AI-FAQ-SEED-V1-CAREGIVER',3,
        '담당 요양보호사 변경은 어떻게 요청하나요?',
        '보호자 포털의 요청 · 문의에서 대상 방문을 선택하고 담당자 관련 문의 유형에 변경을 원하는 내용을 작성해 요청 보내기를 누르세요. 실제 담당자 변경 가능 여부와 처리는 담당 센터에서 확인해야 합니다.'
    UNION ALL SELECT 'AI-FAQ-SEED-V1-CONFIRM',1,
        '문의가 응답 완료이면 일정 변경도 확정된 건가요?',
        '문의 접수나 답변 등록만으로 방문 일정이나 담당자가 변경되지는 않습니다. 실제 변경은 센터에서 별도로 확인하고 처리해야 하므로, 응답 완료 표시만으로 일정 변경이 확정되었다고 판단하지 마세요.'
    UNION ALL SELECT 'AI-FAQ-SEED-V1-EDIT',4,
        '이미 보낸 문의 내용을 수정할 수 있나요?',
        '응답 대기 문의는 요청 내역에서 선택해 내용을 수정할 수 있습니다. 이미 답변이 등록된 문의는 보호자 화면에서 수정할 수 없습니다. 추가로 전달할 내용은 새 문의로 보내주세요.'
) AS seed
JOIN inquirycategory AS category ON category.inquiry_category_no=seed.category_no
JOIN guardians AS guardian ON guardian.user_no=(
    SELECT user_no FROM user WHERE user_id='guardian01' AND user_category_no=1
)
WHERE NOT EXISTS (SELECT 1 FROM guardianinquiry AS existing WHERE existing.inquiry_group=seed.marker)
  AND NOT EXISTS (SELECT 1 FROM ai_faq AS existing WHERE existing.question_text=seed.question);

-- 위에서 사실 확인한 개발용 공통 안내만 승인 상태로 추가한다.
-- 일반 관리자 생성/수정 API는 계속 미승인으로 저장하며 이 seed와 별개이다.
INSERT INTO ai_faq (source_inquiry_no,question_text,answer_text,approved,updated_at)
SELECT source.inquiry_no,source.inquiry_content,source.answer_content,TRUE,NOW()
FROM guardianinquiry AS source
WHERE source.inquiry_group IN (
    'AI-FAQ-SEED-V1-SCHEDULE','AI-FAQ-SEED-V1-MULTI','AI-FAQ-SEED-V1-HISTORY',
    'AI-FAQ-SEED-V1-CAREGIVER','AI-FAQ-SEED-V1-CONFIRM','AI-FAQ-SEED-V1-EDIT'
)
AND source.answer_content IS NOT NULL AND source.answer_date IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM ai_faq AS existing WHERE existing.source_inquiry_no=source.inquiry_no)
AND NOT EXISTS (SELECT 1 FROM ai_faq AS existing WHERE existing.question_text=source.inquiry_content);

COMMIT;
