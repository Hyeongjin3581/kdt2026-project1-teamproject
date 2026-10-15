package oncare_backend;

import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import oncare_backend.service.JwtUtil;
import oncare_backend.service.LLMService;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

// 실제 Spring 서버(임시 포트)와 현재 MySQL로 조회를 검증한다. 자동 DDL/SQL 실행은 끈다.
// 비밀번호 로그인 화면 테스트는 아니며, 기존 JwtUtil로 JWT를 만들어 실제 권한 검사를 거친다.
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"spring.jpa.hibernate.ddl-auto=none","spring.sql.init.mode=never"})
class AiReviewsReadOnlyIntegrationTests {
    @LocalServerPort int port;
    @Autowired JdbcTemplate db;
    @Autowired JwtUtil jwt;
    // LLM만 모의 객체로 바꿔, 목록 조회 중 호출하지 않았는지 검증한다.
    // Controller/Service/Repository/권한 검사/DB는 실제 객체를 사용한다.
    @MockitoBean LLMService llm;
    private final ObjectMapper json=new ObjectMapper();
    private final HttpClient http=HttpClient.newHttpClient();
    // JSON 응답을 확인하기 위해 서버에 실제 GET 요청을 보낸다. 토큰 값은 출력하지 않는다.
    private HttpResponse<String> get(String path,String token)throws Exception {
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path));
        if(token!=null)request.header("Cookie","accessToken="+token);
        return http.send(request.build(),HttpResponse.BodyHandlers.ofString());
    }
    private HttpResponse<String> post(String path,String token)throws Exception {
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path))
                .header("Accept","application/json").POST(HttpRequest.BodyPublishers.noBody());
        if(token!=null)request.header("Cookie","accessToken="+token);
        return http.send(request.build(),HttpResponse.BodyHandlers.ofString());
    }
    @Test void liveDatabaseReadChecksRolesContractStatsAndNoChanges()throws Exception {
        // 1. 조회 전 DB 전체 행을 기억해 둔다. 테스트 데이터 INSERT/UPDATE/DELETE는 없다.
        var beforeReviews=db.queryForList("select * from careworkerreview order by review_no");
        var beforeSentiments=db.queryForList("select * from review_sentiment order by sentiment_no");
        try {
            // 2. 무인증/잘못된 토큰/역할 1~3은 403, 시스템 관리자는 200인지 확인한다.
            for(String denied:new String[]{null,"invalid-token"})assertEquals(403,get("/api/ai/reviews",denied).statusCode());
            for(int role=1;role<=3;role++) {
                Integer user=db.queryForObject("select min(user_no) from user where user_category_no=?",Integer.class,role);
                assertNotNull(user,"live role fixture must exist");
                assertEquals(403,get("/api/ai/reviews",jwt.createAccessToken(user)).statusCode());
                System.out.println("VERIFIED role "+role+" forbidden");
            }
            int admin=db.queryForObject("select min(user_no) from user where user_category_no=4",Integer.class);
            String token=jwt.createAccessToken(admin);
            var response=get("/api/ai/reviews",token);assertEquals(200,response.statusCode());
            JsonNode rows=json.readTree(response.body());assertTrue(rows.isArray());assertEquals(beforeReviews.size(),rows.size());
            var statsResponse=get("/api/ai/reviews/stats",token);assertEquals(200,statsResponse.statusCode());
            JsonNode stats=json.readTree(statsResponse.body());
            // 3. 응답의 필드, 원문/평점, ISO 날짜, 상태별 건수가 DB와 통계에 일치하는지 비교한다.
            Set<String> fields=Set.of("reviewNo","careworkersReportNo","guardianName","careworkerNo","careworkerName","rating","reviewContent","createDate","updateDate","sentiment","analysisStatus","analyzedAt","ratingSentimentMismatch","mismatchReason");
            Map<String,Integer> counts=new HashMap<>();counts.put("analyzed",0);counts.put("pending",0);counts.put("noText",0);
            int mismatchCount=0;
            for(JsonNode row:rows) {
                Set<String> keys=new HashSet<>();row.properties().forEach(e->keys.add(e.getKey()));assertEquals(fields,keys);
                String state=row.path("analysisStatus").asText();assertTrue(counts.containsKey(state));counts.put(state,counts.get(state)+1);
                int id=row.path("reviewNo").asInt();
                assertEquals(db.queryForObject("select rating from careworkerreview where review_no=?",Integer.class,id),row.path("rating").asInt());
                String content=db.queryForObject("select review_content from careworkerreview where review_no=?",String.class,id);
                if(content==null)assertTrue(row.path("reviewContent").isNull());else assertEquals(content,row.path("reviewContent").asText());
                if(!state.equals("analyzed")){assertTrue(row.path("sentiment").isNull());assertTrue(row.path("analyzedAt").isNull());}
                if(state.equals("analyzed")) {
                    var cached=post("/api/ai/reviews/analyze?reviewNo="+id,token);
                    assertEquals(200,cached.statusCode());
                    JsonNode analysis=json.readTree(cached.body());
                    assertTrue(analysis.path("cached").asBoolean());
                    assertEquals(row.path("sentiment").asText(),analysis.path("sentiment").asText());
                }
                int rating=row.path("rating").asInt();String sentiment=row.path("sentiment").asText();
                boolean expected=state.equals("analyzed")&&((rating>=1&&rating<=3&&(sentiment.equals("매우 긍정")||sentiment.equals("긍정")))||(rating>=8&&rating<=10&&(sentiment.equals("매우 부정")||sentiment.equals("부정"))));
                assertEquals(expected,row.path("ratingSentimentMismatch").asBoolean());
                if(expected){assertFalse(row.path("mismatchReason").asText().isBlank());mismatchCount++;}
                else assertTrue(row.path("mismatchReason").isNull());
                for(String date:List.of("createDate","updateDate","analyzedAt"))if(!row.path(date).isNull())java.time.LocalDateTime.parse(row.path(date).asText());
            }
            for(String state:counts.keySet())assertEquals(stats.path(state).asInt(),counts.get(state));
            assertEquals(mismatchCount,stats.path("mismatchCount").asInt());
            if(stats.path("pending").asInt()==0) {
                var batch=post("/api/ai/reviews/analyze-pending",token);
                assertEquals(200,batch.statusCode());assertEquals(0,json.readTree(batch.body()).size());
            }
            // 4. LLM 호출이 없었는지 확인하고, 프론트 참고용 실제 응답을 build에 저장한다.
            verifyNoInteractions(llm);
            Files.createDirectories(Path.of("build/reviews-list-verification"));
            Files.writeString(Path.of("build/reviews-list-verification/live-response.json"),json.writerWithDefaultPrettyPrinter().writeValueAsString(rows));
            System.out.println("VERIFIED admin HTTP 200, exact response contract, live DB values, statistics and no Gemini calls");
        } finally {
            // 5. 성공/실패와 상관없이 전후 DB 행을 비교하여 조회가 데이터를 바꾸지 않았는지 확인한다.
            assertEquals(beforeReviews,db.queryForList("select * from careworkerreview order by review_no"));
            assertEquals(beforeSentiments,db.queryForList("select * from review_sentiment order by sentiment_no"));
            System.out.println("VERIFIED existing review and sentiment rows unchanged; no fixtures inserted");
        }
    }

    @Test void approvedFaqHttpReadsStoredAnswerWithoutCreatingInquiry()throws Exception {
        var beforeFaqs=db.queryForList("select * from ai_faq order by faq_no");
        var beforeInquiries=db.queryForList("select * from guardianinquiry order by inquiry_no");
        try {
            Integer guardian=db.queryForObject("select min(user_no) from user where user_category_no=1",Integer.class);
            Integer admin=db.queryForObject("select min(user_no) from user where user_category_no=4",Integer.class);
            assertNotNull(guardian);assertNotNull(admin);
            assertEquals(403,get("/api/ai/faq",null).statusCode());
            assertEquals(403,get("/api/ai/faq",jwt.createAccessToken(admin)).statusCode());
            String token=jwt.createAccessToken(guardian);
            var response=get("/api/ai/faq",token);assertEquals(200,response.statusCode());
            JsonNode questions=json.readTree(response.body());
            int approved=db.queryForObject("select count(*) from ai_faq where approved=1",Integer.class);
            assertEquals(approved,questions.size());
            for(JsonNode question:questions){
                int id=question.path("faqNo").asInt();
                var answerResponse=get("/api/ai/faq/"+id+"/answer",token);
                assertEquals(200,answerResponse.statusCode());
                JsonNode answer=json.readTree(answerResponse.body());
                assertEquals(db.queryForObject("select answer_text from ai_faq where faq_no=?",String.class,id),answer.path("answer").asText());
            }
            Integer missing=db.queryForObject("select coalesce(max(faq_no),0)+1 from ai_faq",Integer.class);
            assertEquals(404,get("/api/ai/faq/"+missing+"/answer",token).statusCode());
            verifyNoInteractions(llm);
        } finally {
            assertEquals(beforeFaqs,db.queryForList("select * from ai_faq order by faq_no"));
            assertEquals(beforeInquiries,db.queryForList("select * from guardianinquiry order by inquiry_no"));
        }
    }

    // 현재 Controller의 예외가 실제 서버에서 어떤 상태/본문으로 바뀌는지 확인한다.
    // AI 실패는 모의 LLM으로 만들고, 모든 실제 DB 테이블은 전후 비교한다.
    @Test void errorResponsesAndExistingReadApisSurviveAiFailure()throws Exception {
        var beforeReviews=db.queryForList("select * from careworkerreview order by review_no");
        var beforeSentiments=db.queryForList("select * from review_sentiment order by sentiment_no");
        var beforeFaqs=db.queryForList("select * from ai_faq order by faq_no");
        var beforeInquiries=db.queryForList("select * from guardianinquiry order by inquiry_no");
        try {
            int admin=db.queryForObject("select min(user_no) from user where user_category_no=4",Integer.class);
            int guardian=db.queryForObject("select min(u.user_no) from user u join guardians g on g.user_no=u.user_no where u.user_category_no=1 and g.guardian_state='use'",Integer.class);
            String adminToken=jwt.createAccessToken(admin),guardianToken=jwt.createAccessToken(guardian);
            var badRequest=post("/api/ai/reviews/analyze?reviewNo=-1",adminToken);
            var forbidden=get("/api/ai/reviews",null);
            var notFound=get("/api/ai/faq/-1/answer",guardianToken);
            when(llm.LLMCall(anyString())).thenThrow(new IllegalStateException("모의 AI 장애"));
            var failureRequest=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/ai/inquiries/answer"))
                    .header("Cookie","accessToken="+guardianToken).header("Content-Type","application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{\"inquiryCategoryNo\":\"4\",\"question\":\"방문이 끝난 뒤 기록을 보는 곳이 궁금해요\"}")).build();
            var badGateway=http.send(failureRequest,HttpResponse.BodyHandlers.ofString());
            assertEquals(400,badRequest.statusCode());assertEquals(403,forbidden.statusCode());
            assertEquals(404,notFound.statusCode());assertEquals(502,badGateway.statusCode());
            Map<String,Object> errors=new LinkedHashMap<>();
            for(var response:List.of(badRequest,forbidden,notFound,badGateway)) {
                Object body=response.body().isBlank()?null:json.readTree(response.body());
                Map<String,Object> item=new LinkedHashMap<>();
                item.put("status",response.statusCode());item.put("body",body);
                errors.put(String.valueOf(response.statusCode()),item);
            }
            Files.createDirectories(Path.of("build/ai-phase2-verification"));
            Files.writeString(Path.of("build/ai-phase2-verification/http-errors.json"),json.writerWithDefaultPrettyPrinter().writeValueAsString(errors));
            assertEquals(200,get("/api/review/guardian/my",guardianToken).statusCode());
            assertEquals(200,get("/guardianinquiry",guardianToken).statusCode());
        } finally {
            assertEquals(beforeReviews,db.queryForList("select * from careworkerreview order by review_no"));
            assertEquals(beforeSentiments,db.queryForList("select * from review_sentiment order by sentiment_no"));
            assertEquals(beforeFaqs,db.queryForList("select * from ai_faq order by faq_no"));
            assertEquals(beforeInquiries,db.queryForList("select * from guardianinquiry order by inquiry_no"));
        }
    }
}
