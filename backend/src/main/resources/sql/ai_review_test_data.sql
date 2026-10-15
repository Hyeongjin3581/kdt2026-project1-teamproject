-- 개발·시연 DB 전용. 자동 실행하지 않는다.
-- 2026-10-14 개발 DB에서 후기 없는 완료 근무기록 8건만 확인하여 선택했다.
-- 다른 DB에서 실행할 때도 완료 상태, 수급자-보호자 연결, 후기 중복 여부를 다시 검사한다.
-- 보호자 번호는 직접 적지 않고 근무기록 -> 요청 -> 수급자에서 가져온다.
-- 현재는 적격 근무기록이 8건뿐이므로 30건을 만들려면 추가 완료 근무기록 22건이 필요하다.

INSERT INTO careworkerreview
    (careworkers_report_no, guardian_no, rating, review_content, create_date, update_date)
SELECT cr.careworkers_report_no, recipient.guardian_no, sample.rating,
       sample.review_content, NOW(), NOW()
FROM (
    SELECT 2 AS report_no, 10 AS rating, '늘 친절하고 세심하게 돌봐주셔서 매우 만족했습니다.' AS review_content
    UNION ALL SELECT 4, 9, '약속 시간을 잘 지켜주시고 필요한 도움을 주셨습니다.'
    UNION ALL SELECT 5, 5, '방문 서비스는 대체로 보통이었습니다.'
    UNION ALL SELECT 6, 2, '방문 시간이 자주 늦어져 불편했습니다.'
    UNION ALL SELECT 7, 1, '설명도 부족하고 응대도 매우 불친절해 실망했습니다.'
    UNION ALL SELECT 8, 1, '정말 친절하시고 잘 대해주셔서 좋았습니다!'
    UNION ALL SELECT 9, 10, '방문 중 응대가 불친절하고 돌봄도 부족해 아쉬웠습니다.'
    UNION ALL SELECT 18, 8, '꼼꼼하게 살펴주셔서 안심할 수 있었습니다.'
) AS sample
JOIN careworkersreport AS cr ON cr.careworkers_report_no = sample.report_no
JOIN requests AS request ON request.request_no = cr.request_no
JOIN carerecipients AS recipient ON recipient.carerecipient_no = request.carerecipient_no
WHERE cr.work_status = '완료'
  AND recipient.guardian_no IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM careworkerreview AS existing
      WHERE existing.careworkers_report_no = cr.careworkers_report_no
  );

-- 사람의 예상 분류 목록(실제 Gemini 결과와 별도 비교; 모델 결과를 강제하지 않음):
-- 근무기록 2: 매우 긍정 / 일반
-- 근무기록 4: 긍정 / 일반
-- 근무기록 5: 중립 / 일반
-- 근무기록 6: 부정 / 일반
-- 근무기록 7: 매우 부정 / 일반
-- 근무기록 8: 긍정 / 별점·감정 불일치 예상
-- 근무기록 9: 부정 / 별점·감정 불일치 예상
-- 근무기록 18: 긍정 / 일반
