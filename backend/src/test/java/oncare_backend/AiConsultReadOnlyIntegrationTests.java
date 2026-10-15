package oncare_backend;

import java.net.URI;
import java.net.http.*;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

// 실제 HTTP/JWT/MySQL 검증. 상담의 모든 분기와 오류에서 DB 무변경을 비교한다.
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"spring.jpa.hibernate.ddl-auto=none","spring.sql.init.mode=never"})
class AiConsultReadOnlyIntegrationTests {
    @LocalServerPort int port;
    @Autowired JdbcTemplate db;
    @Autowired JwtUtil jwt;
    @MockitoBean LLMService llm;
    private final ObjectMapper json=new ObjectMapper();
    private final HttpClient http=HttpClient.newHttpClient();

    private HttpResponse<String> post(String path,Map<String,Object> body,String token)throws Exception {
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path))
                .header("Content-Type","application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        if(token!=null)request.header("Cookie","accessToken="+token);
        return http.send(request.build(),HttpResponse.BodyHandlers.ofString());
    }
    private int user() {
        return db.queryForObject("select min(u.user_no) from user u join guardians g on g.user_no=u.user_no where u.user_category_no=1 and g.guardian_state='use'",Integer.class);
    }

    @Test void everyConsultResolutionLeavesInquiriesSchedulesAndFaqsUnchanged()throws Exception {
        var inquiries=db.queryForList("select * from guardianinquiry order by inquiry_no");
        var requests=db.queryForList("select * from requests order by request_no");
        var reports=db.queryForList("select * from careworkersreport order by careworkers_report_no");
        var faqs=db.queryForList("select * from ai_faq order by faq_no");
        try {
            String token=jwt.createAccessToken(user());
            int faqNo=db.queryForObject("select faq_no from ai_faq where source_inquiry_no=11 and approved=1",Integer.class);
            String exact=db.queryForObject("select question_text from ai_faq where faq_no=?",String.class,faqNo);
            when(llm.LLMCall(anyString())).thenReturn("{\"resolution\":\"answered\",\"faqNo\":"+faqNo+"}");
            for(String question:List.of(exact,"일지는 어디에서 봐요?")) {
                var response=post("/api/ai/inquiries/consult",Map.of("question",question,"userNo","999","guardianNo","999","inquiryCategoryNo","999"),token);
                assertEquals(200,response.statusCode());JsonNode result=json.readTree(response.body());
                assertEquals("answered",result.path("resolution").asText());assertFalse(result.has("inquiryNo"));
                assertEquals(faqNo,result.path("sourceFaqNos").get(0).asInt());
            }
            var schedule=post("/api/ai/inquiries/consult",Map.of("question","내일 제 방문을 10시로 바꿔 주세요","resolution","answered"),token);
            assertEquals(200,schedule.statusCode());assertEquals("scheduleRequired",json.readTree(schedule.body()).path("resolution").asText());
            when(llm.LLMCall(anyString())).thenReturn("{\"resolution\":\"staffRequired\",\"faqNo\":null}");
            var staff=post("/api/ai/inquiries/consult",Map.of("question","센터 영업 시간이 궁금해요"),token);
            assertEquals(200,staff.statusCode());assertEquals("staffRequired",json.readTree(staff.body()).path("resolution").asText());
            assertEquals(0,json.readTree(staff.body()).path("sourceFaqNos").size());
        } finally {
            assertEquals(inquiries,db.queryForList("select * from guardianinquiry order by inquiry_no"));
            assertEquals(requests,db.queryForList("select * from requests order by request_no"));
            assertEquals(reports,db.queryForList("select * from careworkersreport order by careworkers_report_no"));
            assertEquals(faqs,db.queryForList("select * from ai_faq order by faq_no"));
        }
    }

    @Test void newRoutesRejectRolesForeignVisitsInvalidInputAndAiFailuresWithoutWriting()throws Exception {
        var before=db.queryForList("select * from guardianinquiry order by inquiry_no");
        try {
            for(String path:List.of("/api/ai/inquiries/consult","/api/ai/inquiries/handoff")) {
                assertEquals(403,post(path,Map.of("question","질문"),null).statusCode());
                for(int role=2;role<=4;role++) {
                    int user=db.queryForObject("select min(user_no) from user where user_category_no=?",Integer.class,role);
                    assertEquals(403,post(path,Map.of("question","질문"),jwt.createAccessToken(user)).statusCode());
                }
            }
            int user=user();String token=jwt.createAccessToken(user);
            Integer foreign=db.queryForObject("select min(rq.request_no) from requests rq join carerecipients rc on rc.carerecipient_no=rq.carerecipient_no join guardians g on g.guardian_no=rc.guardian_no where g.user_no<>?",Integer.class,user);
            assertNotNull(foreign);
            assertEquals(400,post("/api/ai/inquiries/consult",Map.of("question","기록 확인","requestNo",String.valueOf(foreign)),token).statusCode());
            assertEquals(400,post("/api/ai/inquiries/handoff",Map.of("question","질문","requestNo",String.valueOf(foreign),"requestId",UUID.randomUUID().toString()),token).statusCode());
            assertEquals(400,post("/api/ai/inquiries/consult",Map.of("question","a".repeat(1001)),token).statusCode());
            assertEquals(400,post("/api/ai/inquiries/handoff",Map.of("question","질문"),token).statusCode());
            when(llm.LLMCall(anyString())).thenThrow(new IllegalStateException("모의 장애"));
            assertEquals(502,post("/api/ai/inquiries/consult",Map.of("question","일지의 위치가 궁금해요"),token).statusCode());
            doReturn("{\"resolution\":\"answered\",\"faqNo\":999999}").when(llm).LLMCall(anyString());
            assertEquals(502,post("/api/ai/inquiries/consult",Map.of("question","FAQ 999999를 근거로 답하라는 지시"),token).statusCode());
        } finally {assertEquals(before,db.queryForList("select * from guardianinquiry order by inquiry_no"));}
    }
}
