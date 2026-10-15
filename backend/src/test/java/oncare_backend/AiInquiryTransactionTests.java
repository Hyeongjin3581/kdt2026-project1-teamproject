package oncare_backend;

import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import oncare_backend.service.*;
import oncare_backend.model.repository.GuardianRepository;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

// 실제 MySQL에 새 행을 flush하여 상태를 확인한 뒤 테스트 트랜잭션을 롤백한다.
// 기존 사용자 문의/방문을 수정하지 않으며 LLM은 모의 객체이다.
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"spring.jpa.hibernate.ddl-auto=none","spring.sql.init.mode=never"})
class AiInquiryTransactionTests {
    @Autowired AiInquiryService service;
    @Autowired JdbcTemplate db;
    @Autowired PlatformTransactionManager transactions;
    @Autowired GuardianRepository guardians;
    @MockitoBean LLMService llm;

    private int user() {
        return db.queryForObject("select min(u.user_no) from user u join guardians g on g.user_no=u.user_no where u.user_category_no=1 and g.guardian_state='use'",Integer.class);
    }
    private int faqNo() {
        return db.queryForObject("select faq_no from ai_faq where source_inquiry_no=11 and approved=1",Integer.class);
    }

    @Test void answeredParaphrasedSuggestedAndStaffCasesAreStoredOnceThenRolledBack() {
        var before=db.queryForList("select * from guardianinquiry order by inquiry_no");
        var beforeRequests=db.queryForList("select * from requests order by request_no");
        var beforeReports=db.queryForList("select * from careworkersreport order by careworkers_report_no");
        int initialPending=db.queryForObject("select count(*) from guardianinquiry where answer_content is null",Integer.class);
        int faqNo=faqNo(),user=user();
        String question=db.queryForObject("select question_text from ai_faq where faq_no=?",String.class,faqNo);
        when(llm.LLMCall(anyString())).thenReturn("{\"resolution\":\"answered\",\"faqNo\":"+faqNo+"}");
        new TransactionTemplate(transactions).execute(status->{
            var exact=service.answer(4,question,null,user);
            var paraphrase=service.answer(4,"방문 후 남겨진 기록을 보려면 어느 화면으로 가나요?",null,user);
            @SuppressWarnings("unchecked")
            List<String> drafts=(List<String>)service.drafts(4,user).get("questions");
            assertFalse(drafts.isEmpty());
            var suggestion=service.answer(4,drafts.get(0),null,user);
            for(var response:List.of(exact,paraphrase,suggestion)) {
                assertEquals(false,response.get("needsStaff"));assertEquals("응답 완료",response.get("status"));
                assertEquals("[AI 안내] "+response.get("answer"),db.queryForObject("select answer_content from guardianinquiry where inquiry_no=?",String.class,response.get("inquiryNo")));
                assertNotNull(db.queryForObject("select answer_date from guardianinquiry where inquiry_no=?",java.sql.Timestamp.class,response.get("inquiryNo")));
            }
            assertEquals(initialPending,db.queryForObject("select count(*) from guardianinquiry where answer_content is null",Integer.class));
            var staff=service.answer(1,"내일 제 방문을 10시로 변경해 주세요",null,user);
            assertEquals(true,staff.get("needsStaff"));assertEquals("응답 대기",staff.get("status"));
            assertNull(db.queryForObject("select answer_content from guardianinquiry where inquiry_no=?",String.class,staff.get("inquiryNo")));
            assertNull(db.queryForObject("select answer_date from guardianinquiry where inquiry_no=?",java.sql.Timestamp.class,staff.get("inquiryNo")));
            assertEquals(before.size()+4,db.queryForObject("select count(*) from guardianinquiry",Integer.class));
            status.setRollbackOnly();return null;
        });
        assertEquals(before,db.queryForList("select * from guardianinquiry order by inquiry_no"));
        assertEquals(beforeRequests,db.queryForList("select * from requests order by request_no"));
        assertEquals(beforeReports,db.queryForList("select * from careworkersreport order by careworkers_report_no"));
        verify(llm,times(1)).LLMCall(anyString());
    }

    @Test void failedLlmWritesNothingAndRetryHasOnlyOneInsert() {
        var before=db.queryForList("select * from guardianinquiry order by inquiry_no");
        int user=user(),faqNo=faqNo();
        when(llm.LLMCall(anyString())).thenThrow(new IllegalStateException("모의 통신 실패"))
                .thenReturn("{\"resolution\":\"answered\",\"faqNo\":"+faqNo+"}");
        String question="서비스 방문이 끝난 기록을 찾아보고 싶어요";
        assertThrows(IllegalStateException.class,()->service.answer(4,question,null,user));
        assertEquals(before,db.queryForList("select * from guardianinquiry order by inquiry_no"));
        new TransactionTemplate(transactions).execute(status->{
            assertEquals(false,service.answer(4,question,null,user).get("needsStaff"));
            assertEquals(before.size()+1,db.queryForObject("select count(*) from guardianinquiry",Integer.class));
            status.setRollbackOnly();return null;
        });
        assertEquals(before,db.queryForList("select * from guardianinquiry order by inquiry_no"));
    }

    @Test void handoffReplayCreatesOneRowAndNewIntentAllowsSameTextThenRollback() {
        var before=db.queryForList("select * from guardianinquiry order by inquiry_no");
        int user=user();String key=UUID.randomUUID().toString();
        new TransactionTemplate(transactions).execute(status->{
            var first=service.handoff("센터 운영 시간이 궁금합니다",null,key,user);
            var replay=service.handoff(" 센터 운영 시간이 궁금합니다 ",null,key,user);
            assertEquals(first,replay);
            assertEquals(before.size()+1,db.queryForObject("select count(*) from guardianinquiry",Integer.class));
            assertNull(db.queryForObject("select answer_content from guardianinquiry where inquiry_no=?",String.class,first.get("inquiryNo")));
            assertNull(db.queryForObject("select answer_date from guardianinquiry where inquiry_no=?",java.sql.Timestamp.class,first.get("inquiryNo")));
            var different=service.handoff("센터 운영 시간이 궁금합니다",null,UUID.randomUUID().toString(),user);
            assertNotEquals(first.get("inquiryNo"),different.get("inquiryNo"));
            assertEquals(before.size()+2,db.queryForObject("select count(*) from guardianinquiry",Integer.class));
            var conflict=assertThrows(org.springframework.web.server.ResponseStatusException.class,
                    ()->service.handoff("변경된 내용",null,key,user));
            assertEquals(409,conflict.getStatusCode().value());
            status.setRollbackOnly();return null;
        });
        assertEquals(before,db.queryForList("select * from guardianinquiry order by inquiry_no"));
        verifyNoInteractions(llm);
    }

    @Test void guardianLockSerializesTwoDatabaseTransactionsWithoutChangingRows()throws Exception {
        int user=user();
        var before=db.queryForList("select * from guardianinquiry order by inquiry_no");
        ExecutorService pool=Executors.newFixedThreadPool(2);
        CountDownLatch acquired=new CountDownLatch(1),release=new CountDownLatch(1),secondStarted=new CountDownLatch(1);
        try {
            Future<Boolean> first=pool.submit(()->new TransactionTemplate(transactions).execute(status->{
                assertTrue(guardians.findForInquiryHandoff(user).isPresent());acquired.countDown();
                try {if(!release.await(5,TimeUnit.SECONDS))throw new IllegalStateException("lock test timeout");}
                catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException(e);}
                status.setRollbackOnly();return true;
            }));
            assertTrue(acquired.await(5,TimeUnit.SECONDS));
            Future<Boolean> second=pool.submit(()->new TransactionTemplate(transactions).execute(status->{
                secondStarted.countDown();assertTrue(guardians.findForInquiryHandoff(user).isPresent());
                status.setRollbackOnly();return true;
            }));
            assertTrue(secondStarted.await(5,TimeUnit.SECONDS));
            assertThrows(TimeoutException.class,()->second.get(300,TimeUnit.MILLISECONDS));
            release.countDown();assertTrue(first.get(5,TimeUnit.SECONDS));assertTrue(second.get(5,TimeUnit.SECONDS));
        } finally {release.countDown();pool.shutdownNow();}
        assertEquals(before,db.queryForList("select * from guardianinquiry order by inquiry_no"));
    }
}
