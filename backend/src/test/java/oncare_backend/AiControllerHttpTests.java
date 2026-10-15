package oncare_backend;

import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import oncare_backend.controller.AiController;
import oncare_backend.service.*;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

// 실제 DB와 Gemini 대신 모의 Service를 사용해 기존 12개와 신규 2개 주소의 HTTP 계약을 검사한다.
// ResponseStatusException은 Spring MVC가 상태 코드로 변환하므로 Controller를 직접 부르는 검사와 구분한다.
class AiControllerHttpTests {
    private final AuthChecker auth=mock(AuthChecker.class);
    private final JwtUtil jwt=mock(JwtUtil.class);
    private final ReviewSentimentService reviews=mock(ReviewSentimentService.class);
    private final AiFaqService faqs=mock(AiFaqService.class);
    private final AiInquiryService inquiries=mock(AiInquiryService.class);
    private final ObjectMapper json=new ObjectMapper();
    private MockMvc mvc;

    private static final String[][] ROUTES={
        {"POST","/api/ai/inquiries/drafts?inquiryCategoryNo=4","1"},
        {"POST","/api/ai/inquiries/answer","1"},
        {"GET","/api/ai/reviews","4"},
        {"POST","/api/ai/reviews/analyze?reviewNo=9","4"},
        {"POST","/api/ai/reviews/analyze-pending","4"},
        {"GET","/api/ai/reviews/stats","4"},
        {"POST","/api/ai/faq/generate?inquiryNo=11","4"},
        {"GET","/api/ai/faq/admin","4"},
        {"PUT","/api/ai/faq/7","4"},
        {"PUT","/api/ai/faq/7/approve?approved=true","4"},
        {"GET","/api/ai/faq","1"},
        {"GET","/api/ai/faq/7/answer","1"},
        {"POST","/api/ai/inquiries/consult","1"},
        {"POST","/api/ai/inquiries/handoff","1"}
    };

    @BeforeEach void setup() {
        AiController controller=new AiController();
        ReflectionTestUtils.setField(controller,"authChecker",auth);
        ReflectionTestUtils.setField(controller,"jwtUtil",jwt);
        ReflectionTestUtils.setField(controller,"sentimentService",reviews);
        ReflectionTestUtils.setField(controller,"faqService",faqs);
        ReflectionTestUtils.setField(controller,"inquiryService",inquiries);
        when(auth.hasRole(any(),anyInt())).thenAnswer(call->("role"+call.getArgument(1)).equals(call.getArgument(0)));
        when(jwt.getUserNoFromAccessToken("role1")).thenReturn(8);
        mvc=MockMvcBuilders.standaloneSetup(controller).build();
    }

    private MockHttpServletRequestBuilder call(String method,String url,String token) {
        var req=request(HttpMethod.valueOf(method),url).contentType(MediaType.APPLICATION_JSON)
                .content("{\"inquiryCategoryNo\":\"4\",\"question\":\"질문\",\"requestNo\":\"\",\"answer\":\"답변\",\"requestId\":\"8bf65a6b-cd30-4ddc-8d5d-5553412fe080\"}");
        if(token!=null)req.cookie(new Cookie("accessToken",token));
        return req;
    }

    @Test void allFourteenRoutesPreserveRoleChecks()throws Exception {
        for(String[] route:ROUTES){
            assertEquals(403,mvc.perform(call(route[0],route[1],null)).andReturn().getResponse().getStatus(),route[1]);
            for(int role=1;role<=4;role++){
                if(route[2].equals(String.valueOf(role)))continue;
                assertEquals(403,mvc.perform(call(route[0],route[1],"role"+role)).andReturn().getResponse().getStatus(),route[1]);
            }
        }
        verifyNoInteractions(jwt,reviews,faqs,inquiries);
    }

    @Test void existingAndNewSuccessBodiesKeepTheirJsonShape()throws Exception {
        Map<String,Object> draft=Map.of("inquiryCategoryNo",4,"questions",List.of("초안"));
        Map<String,Object> inquiry=Map.of("inquiryNo",21,"inquiryCategoryNo",4,"answer","접수 안내","needsStaff",true,"status","응답 대기");
        Map<String,Object> analysis=Map.of("reviewNo",9,"sentiment","매우 긍정","cached",true);
        Map<String,Object> faq=Map.of("faqNo",7,"question","질문","answer","DB 답변","approved",false,"sourceInquiryNo",11);
        when(inquiries.drafts(4,8)).thenReturn(draft);
        when(inquiries.answer(4,"질문",null,8)).thenReturn(inquiry);
        when(reviews.reviews()).thenReturn(List.of(analysis));
        when(reviews.analyze(9)).thenReturn(analysis);
        when(reviews.analyzePending()).thenReturn(List.of());
        when(reviews.stats()).thenReturn(Map.of("total",0,"analyzed",0,"pending",0,"noText",0,"counts",Map.of(),"percentages",Map.of(),"mismatchCount",0));
        when(faqs.generate(11)).thenReturn(faq);
        when(faqs.adminList()).thenReturn(List.of(faq));
        when(faqs.edit(7,"질문","답변")).thenReturn(true);
        when(faqs.approve(7,true)).thenReturn(true);
        when(faqs.questions()).thenReturn(List.of(Map.of("faqNo",7,"question","질문")));
        when(faqs.answer(7)).thenReturn(Map.of("faqNo",7,"question","질문","answer","DB 답변"));
        Map<String,Object> consultation=Map.of("answer","DB 답변","resolution","answered","sourceFaqNos",List.of(7));
        Map<String,Object> handoff=Map.of("inquiryNo",21,"inquiryCategoryNo",4,"status","응답 대기");
        when(inquiries.consult("질문",null,8)).thenReturn(consultation);
        when(inquiries.handoff("질문",null,"8bf65a6b-cd30-4ddc-8d5d-5553412fe080",8)).thenReturn(handoff);
        Object[] expected={draft,inquiry,List.of(analysis),analysis,List.of(),reviews.stats(),faq,List.of(faq),true,true,faqs.questions(),faqs.answer(7),consultation,handoff};
        for(int i=0;i<ROUTES.length;i++){
            String[] route=ROUTES[i];
            var response=mvc.perform(call(route[0],route[1],"role"+route[2])).andReturn().getResponse();
            assertEquals(200,response.getStatus(),route[1]);
            assertEquals(json.valueToTree(expected[i]),json.readTree(response.getContentAsString(StandardCharsets.UTF_8)),route[1]);
        }
    }

    @Test void inputMissingFaqAndAiFailuresKeep400404502()throws Exception {
        when(faqs.answer(7)).thenReturn(null);
        when(reviews.analyze(9)).thenThrow(new IllegalArgumentException("후기가 없습니다."));
        assertEquals(400,mvc.perform(call("POST","/api/ai/reviews/analyze?reviewNo=9","role4")).andReturn().getResponse().getStatus());
        assertEquals(400,mvc.perform(call("POST","/api/ai/inquiries/answer","role1").content("{\"inquiryCategoryNo\":\"abc\"}")).andReturn().getResponse().getStatus());
        assertEquals(404,mvc.perform(call("GET","/api/ai/faq/7/answer","role1")).andReturn().getResponse().getStatus());
        doThrow(new IllegalStateException("AI 호출 실패")).when(reviews).analyze(9);
        when(inquiries.drafts(4,8)).thenThrow(new IllegalStateException("AI 호출 실패"));
        when(faqs.generate(11)).thenThrow(new IllegalStateException("AI 호출 실패"));
        for(String url:List.of("/api/ai/reviews/analyze?reviewNo=9","/api/ai/faq/generate?inquiryNo=11"))
            assertEquals(502,mvc.perform(call("POST",url,"role4")).andReturn().getResponse().getStatus());
        assertEquals(502,mvc.perform(call("POST","/api/ai/inquiries/drafts?inquiryCategoryNo=4","role1")).andReturn().getResponse().getStatus());
    }

    @Test void newApisKeepErrorsAndIgnoreClientIdentityOrResolution()throws Exception {
        when(inquiries.consult("질문",null,8)).thenReturn(Map.of("answer","안내","resolution","staffRequired","sourceFaqNos",List.of()));
        var response=mvc.perform(call("POST","/api/ai/inquiries/consult","role1")
                .content("{\"question\":\"질문\",\"guardianNo\":\"999\",\"userNo\":\"999\",\"resolution\":\"answered\"}")).andReturn().getResponse();
        assertEquals(200,response.getStatus());verify(inquiries).consult("질문",null,8);
        when(inquiries.handoff("질문",null,"8bf65a6b-cd30-4ddc-8d5d-5553412fe080",8))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT));
        assertEquals(409,mvc.perform(call("POST","/api/ai/inquiries/handoff","role1")).andReturn().getResponse().getStatus());
        doThrow(new IllegalStateException("통신 실패")).when(inquiries).consult("질문",null,8);
        assertEquals(502,mvc.perform(call("POST","/api/ai/inquiries/consult","role1")).andReturn().getResponse().getStatus());
        doThrow(new IllegalArgumentException("키 없음")).when(inquiries).handoff("질문",null,null,8);
        assertEquals(400,mvc.perform(call("POST","/api/ai/inquiries/handoff","role1").content("{\"question\":\"질문\"}")).andReturn().getResponse().getStatus());
    }
}
