package oncare_backend;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import oncare_backend.controller.AiController;
import oncare_backend.model.entity.*;
import oncare_backend.model.repository.*;
import oncare_backend.service.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

// 기능 검증용 파일: Mockito로 Repository를 대체하여 실제 DB 수정 없이 상태/정렬을 확인한다.
// 테스트의 review()와 saved()가 만든 객체는 메모리에만 있으며 실제 후기 등록이 아니다.
class ReviewSentimentReviewsTests {
    private final CareworkerReviewRepository reviewRepository = mock(CareworkerReviewRepository.class);
    private final ReviewSentimentRepository sentimentRepository = mock(ReviewSentimentRepository.class);
    private final LLMService llmService = mock(LLMService.class);
    private final ReviewSentimentService service = new ReviewSentimentService();
    private static final Set<String> FIELDS = Set.of("reviewNo", "careworkersReportNo", "guardianName", "careworkerNo",
            "careworkerName", "rating", "reviewContent", "createDate", "updateDate", "sentiment", "analysisStatus", "analyzedAt",
            "ratingSentimentMismatch", "mismatchReason");

    // Spring 서버를 띄우지 않으므로 테스트에서 직접 모의 객체를 Service 필드에 넣는다.
    ReviewSentimentReviewsTests() {
        ReflectionTestUtils.setField(service, "reviewRepository", reviewRepository);
        ReflectionTestUtils.setField(service, "sentimentRepository", sentimentRepository);
        ReflectionTestUtils.setField(service, "llmService", llmService);
    }
    // 매 테스트 종료 후: 읽기 요청이 LLM 호출이나 Repository 저장/삭제를 하지 않았는지 확인한다.
    @AfterEach void readsNeverCallAiOrSave() {
        verifyNoInteractions(llmService);
        verify(reviewRepository, never()).save(any());
        verify(sentimentRepository, never()).save(any());
        verify(reviewRepository, never()).delete(any());
        verify(sentimentRepository, never()).delete(any());
    }
    // 테스트 후기 객체 만들기. ReflectionTestUtils는 setter가 없는 작성일도 테스트용으로 지정한다.
    private CareworkerReviewEntity review(int id, String content, LocalDateTime created) {
        CareworkerReviewEntity r = CareworkerReviewEntity.builder().reviewNo(id).rating(8).reviewContent(content).build();
        ReflectionTestUtils.setField(r, "createDate", created);
        return r;
    }
    // 테스트 저장 결과를 준비한다. 실제 Repository.save()는 호출하지 않는다.
    private void saved(int id, String content, String sentiment) throws Exception {
        ReviewSentimentEntity saved = new ReviewSentimentEntity();
        saved.setSentiment(sentiment);
        saved.setContentHash(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content.getBytes(StandardCharsets.UTF_8))));
        saved.setAnalyzedAt(LocalDateTime.of(2026,10,14,10,0));
        when(sentimentRepository.findByReviewEntity_ReviewNo(id)).thenReturn(saved);
    }
    // [1] 관리자 조회에서 후기가 실제로 없다는 모의 응답이면 200과 빈 목록을 반환한다.
    @Test void emptyListReturns200AndEmptyArray() {
        when(reviewRepository.findAll()).thenReturn(List.of());
        AuthChecker auth = mock(AuthChecker.class);
        when(auth.hasRole("admin", 4)).thenReturn(true);
        AiController controller = new AiController();
        ReflectionTestUtils.setField(controller, "authChecker", auth);
        ReflectionTestUtils.setField(controller, "sentimentService", service);
        assertEquals(List.of(), controller.reviews("admin"));
    }
    // [2] 5단계 분류는 저장된 값 그대로 반환한다. 같은 평점이라도 감정을 추정하지 않는다.
    @Test void allFiveValidLabelsAreReturnedWithoutGuessingFromRating() throws Exception {
        List<CareworkerReviewEntity> rows = new ArrayList<>();
        List<String> labels = List.of("매우 긍정", "긍정", "중립", "부정", "매우 부정");
        for (int i=0;i<labels.size();i++) {
            rows.add(review(i+1, "원문"+i, null));
            saved(i+1, "원문"+i, labels.get(i));
        }
        when(reviewRepository.findAll()).thenReturn(rows);
        for(Map<String,Object> row : service.reviews()) {
            int id=(Integer)row.get("reviewNo");
            assertEquals(FIELDS,row.keySet());
            assertEquals("analyzed",row.get("analysisStatus"));
            assertEquals(labels.get(id-1),row.get("sentiment"));
            assertNotNull(row.get("analyzedAt"));
            assertEquals(8,row.get("rating"));
        }
    }
    // [3] 결과 없음 / 수정 전 해시 / 잘못된 분류는 pending, 감정과 분석일은 null이다.
    @Test void absentStaleOrInvalidResultsArePendingAndHideOldAnalysis() throws Exception {
        when(reviewRepository.findAll()).thenReturn(List.of(review(1,"현재 내용",null),review(2,"수정된 내용",null),review(3,"내용",null)));
        saved(2,"수정 전 내용","긍정");saved(3,"내용","잘못된 분류");
        for(Map<String,Object> row : service.reviews()) {
            assertEquals("pending",row.get("analysisStatus"));
            assertNull(row.get("sentiment"));assertNull(row.get("analyzedAt"));
            assertEquals(false,row.get("ratingSentimentMismatch"));assertNull(row.get("mismatchReason"));
        }
        assertEquals(3, service.stats().get("pending"));
        assertEquals(0, service.stats().get("mismatchCount"));
    }
    // [4] 현재 내용이 없으면 과거 결과가 있어도 noText이다.
    @Test void nullOrWhitespaceContentIsNoTextEvenWithPastAnalysis() throws Exception {
        when(reviewRepository.findAll()).thenReturn(List.of(review(1,null,null),review(2," \n\t ",null)));
        saved(1,"前の内容","긍정");saved(2," \n\t ","긍정");
        for(Map<String,Object> row : service.reviews()) {
            assertEquals(FIELDS,row.keySet());assertEquals("noText",row.get("analysisStatus"));
            assertNull(row.get("sentiment"));assertNull(row.get("analyzedAt"));
            assertEquals(false,row.get("ratingSentimentMismatch"));assertNull(row.get("mismatchReason"));
        }
        assertEquals(2, service.stats().get("noText"));
    }
    // [5] 작성일 최신순, 같은 작성일은 번호 내림차순, 작성일 null은 마지막이다.
    @Test void sortsNewestThenIdDescendingAndNullDatesLast() {
        LocalDateTime date=LocalDateTime.of(2026,10,14,9,0);
        when(reviewRepository.findAll()).thenReturn(List.of(review(1,"",null),review(2,"",date),review(3,"",date.minusDays(1)),review(4,"",date),review(5,"",null)));
        List<Integer> ids = new ArrayList<>();
        for(Map<String,Object> row:service.reviews())ids.add((Integer)row.get("reviewNo"));
        assertEquals(List.of(4,2,3,5,1),ids);
    }
    // [6] 연결 객체가 없어도 목록을 유지하고 이름/번호만 null로 반환한다.
    @Test void missingRelationsAreNullAndLinkedFieldsUseOriginalValues() {
        CareworkerReviewEntity first=review(1,"후기 원문 그대로",LocalDateTime.of(2026,10,14,9,0));
        first.setGuardianEntity(GuardianEntity.builder().guardianName("테스트 보호자").build());
        first.setCareworkerReportEntity(CareworkerReportEntity.builder().careworkersReportNo(31)
                .careworkerEntity(CareworkerEntity.builder().careworkerNo(5).careworkerName("테스트 요양보호사").build()).build());
        CareworkerReviewEntity noWorker=review(2,"",null);
        noWorker.setCareworkerReportEntity(CareworkerReportEntity.builder().careworkersReportNo(32).build());
        when(reviewRepository.findAll()).thenReturn(List.of(first,noWorker,review(3,null,null)));
        List<Map<String,Object>> rows=service.reviews();
        Map<String,Object> linked=rows.get(0);
        assertEquals("테스트 보호자",linked.get("guardianName"));assertEquals(31,linked.get("careworkersReportNo"));
        assertEquals(5,linked.get("careworkerNo"));assertEquals("테스트 요양보호사",linked.get("careworkerName"));
        assertEquals("후기 원문 그대로",linked.get("reviewContent"));
        for(int i=1;i<rows.size();i++) {
            assertEquals(FIELDS,rows.get(i).keySet());assertNull(rows.get(i).get("guardianName"));
            assertNull(rows.get(i).get("careworkerNo"));assertNull(rows.get(i).get("careworkerName"));
        }
        assertEquals(32,rows.get(2).get("careworkersReportNo"));
        assertNull(rows.get(1).get("careworkersReportNo"));
    }
    // [7] 동일한 모의 후기로 목록의 상태별 건수와 stats()의 건수를 비교한다.
    @Test void listStatusesMatchStatisticsForMixedRows() throws Exception {
        when(reviewRepository.findAll()).thenReturn(List.of(review(1,"有効",null),review(2,"未分析",null),review(3,"改訂",null),review(4," ",null),review(5,"無効",null)));
        saved(1,"有効","긍정");saved(3,"旧版","부정");saved(5,"無効","other");
        Map<String,Object> stats=service.stats();
        List<Map<String,Object>> rows=service.reviews();
        for(String state:List.of("analyzed","pending","noText")) {
            int count=0;for(Map<String,Object> row:rows)if(state.equals(row.get("analysisStatus")))count++;
            assertEquals(stats.get(state),count);
        }
        assertEquals(stats.get("total"),rows.size());
        int mismatches=0;for(Map<String,Object> row:rows)if(Boolean.TRUE.equals(row.get("ratingSentimentMismatch")))mismatches++;
        assertEquals(stats.get("mismatchCount"),mismatches);
    }

    // [8] 별점과 현재 감정의 양방향 모순만 검토 대상으로 표시하고 기존 감정 통계에도 포함한다.
    @Test void mismatchRulesCoverBothDirectionsAndNormalCombinations() throws Exception {
        CareworkerReviewEntity low=review(1,"친절했습니다",null);low.setRating(1);
        CareworkerReviewEntity high=review(2,"불친절했습니다",null);high.setRating(10);
        CareworkerReviewEntity positive=review(3,"좋았습니다",null);positive.setRating(10);
        CareworkerReviewEntity neutral=review(4,"보통입니다",null);neutral.setRating(5);
        when(reviewRepository.findAll()).thenReturn(List.of(low,high,positive,neutral));
        saved(1,"친절했습니다","매우 긍정");saved(2,"불친절했습니다","매우 부정");
        saved(3,"좋았습니다","매우 긍정");saved(4,"보통입니다","중립");
        List<Map<String,Object>> rows=service.reviews();
        Map<Integer,Map<String,Object>> byNo=new HashMap<>();
        for(Map<String,Object> row:rows)byNo.put((Integer)row.get("reviewNo"),row);
        assertEquals(true,byNo.get(1).get("ratingSentimentMismatch"));
        assertEquals("낮은 평점과 긍정적인 후기 내용이 일치하지 않습니다.",byNo.get(1).get("mismatchReason"));
        assertEquals(true,byNo.get(2).get("ratingSentimentMismatch"));
        assertEquals("높은 평점과 부정적인 후기 내용이 일치하지 않습니다.",byNo.get(2).get("mismatchReason"));
        assertEquals(false,byNo.get(3).get("ratingSentimentMismatch"));assertNull(byNo.get(3).get("mismatchReason"));
        assertEquals(false,byNo.get(4).get("ratingSentimentMismatch"));assertNull(byNo.get(4).get("mismatchReason"));
        Map<String,Object> stats=service.stats();
        assertEquals(4,stats.get("analyzed"));assertEquals(2,stats.get("mismatchCount"));
        assertEquals(2,((Map<?,?>)stats.get("counts")).get("매우 긍정"));
        assertEquals(1,((Map<?,?>)stats.get("counts")).get("매우 부정"));
    }

    // [9] 평점만 바뀌면 저장 감정을 재사용하고, 내용이 바뀌면 과거 감정을 숨긴다.
    @Test void ratingEditRecalculatesAndContentEditBecomesPending() throws Exception {
        CareworkerReviewEntity row=review(1,"친절했습니다",null);row.setRating(1);
        when(reviewRepository.findAll()).thenReturn(List.of(row));
        saved(1,"친절했습니다","긍정");
        assertEquals(true,service.reviews().get(0).get("ratingSentimentMismatch"));
        row.setRating(10);
        assertEquals(false,service.reviews().get(0).get("ratingSentimentMismatch"));
        assertEquals(0,service.stats().get("mismatchCount"));
        row.setReviewContent("내용을 수정했습니다");
        assertEquals("pending",service.reviews().get(0).get("analysisStatus"));
        assertNull(service.reviews().get(0).get("sentiment"));
        assertEquals(false,service.reviews().get(0).get("ratingSentimentMismatch"));
        assertEquals(0,service.stats().get("mismatchCount"));
    }
}
