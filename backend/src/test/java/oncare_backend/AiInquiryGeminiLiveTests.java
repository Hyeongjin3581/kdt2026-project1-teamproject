package oncare_backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import oncare_backend.service.AiInquiryService;
import static org.junit.jupiter.api.Assertions.*;

// 명시적으로 환경 변수를 켰을 때만 실제 Gemini를 호출한다. 일반 test 실행에서는 건너뛴다.
@EnabledIfEnvironmentVariable(named="ONCARE_VERIFY_GEMINI",matches="true")
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"spring.jpa.hibernate.ddl-auto=none","spring.sql.init.mode=never"})
class AiInquiryGeminiLiveTests {
    @Autowired AiInquiryService service;
    @Autowired JdbcTemplate db;

    @Test void realGeminiConsultsApprovedAnswerWithoutSavingInquiry() {
        var before=db.queryForList("select * from guardianinquiry order by inquiry_no");
        int user=db.queryForObject("select min(u.user_no) from user u join guardians g on g.user_no=u.user_no where u.user_category_no=1 and g.guardian_state='use'",Integer.class);
        var response=service.consult("돌봄을 마친 뒤 방문 일지를 보려면 어느 화면을 열어야 하나요?",null,user);
        assertEquals("answered",response.get("resolution"));
        assertTrue(response.get("answer").toString().contains("방문 기록"));
        assertFalse(response.containsKey("inquiryNo"));
        System.out.println("LIVE FAQ: " + response.get("answer"));
        assertEquals(before,db.queryForList("select * from guardianinquiry order by inquiry_no"));
    }

    @Test void realGeminiGeneratesGeneralAnswerAndKeepsUnknownCenterPolicyPending() {
        var before=db.queryForList("select * from guardianinquiry order by inquiry_no");
        int user=db.queryForObject("select min(u.user_no) from user u join guardians g on g.user_no=u.user_no where u.user_category_no=1 and g.guardian_state='use'",Integer.class);
        var general=service.consult("방문요양이 어떤 서비스인지 쉽게 설명해 주세요.",null,user);
        assertEquals("answered",general.get("resolution"));
        assertFalse(general.get("answer").toString().isBlank());
        assertEquals(java.util.List.of(),general.get("sourceFaqNos"));
        System.out.println("LIVE GENERAL: " + general.get("answer"));
        var policy=service.consult("우리 센터의 정확한 영업시간과 야간 추가 요금을 알려주세요.",null,user);
        assertEquals("staffRequired",policy.get("resolution"));
        assertEquals(before,db.queryForList("select * from guardianinquiry order by inquiry_no"));
    }
}
