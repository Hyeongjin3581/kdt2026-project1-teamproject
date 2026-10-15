package oncare_backend;

import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import oncare_backend.controller.AiController;
import oncare_backend.model.entity.AiFaqEntity;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.entity.GuardianInquiryEntity;
import oncare_backend.model.entity.InquiryCategoryEntity;
import oncare_backend.model.repository.AiFaqRepository;
import oncare_backend.model.repository.GuardianInquiryRepository;
import oncare_backend.model.repository.GuardianRepository;
import oncare_backend.model.repository.InquiryCategoryRepository;
import oncare_backend.service.AiFaqService;
import oncare_backend.service.AiInquiryService;
import oncare_backend.service.AuthChecker;
import oncare_backend.service.LLMService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// 실제 DB 변경 없이 FAQ 선택과 새 문의 등록의 경계를 확인한다.
class AiFaqImmediateAnswerTests {
    @Test void approvedFaqReturnsStoredAnswerWithoutCreatingInquiryOrCallingGemini() {
        AiFaqRepository faqs=mock(AiFaqRepository.class);
        GuardianInquiryRepository inquiries=mock(GuardianInquiryRepository.class);
        LLMService llm=mock(LLMService.class);
        AiFaqEntity faq=new AiFaqEntity();
        faq.setFaqNo(7);faq.setQuestionText("방문 기록은 어디서 확인하나요?");
        faq.setAnswerText("저장된 관리자 답변입니다.");faq.setApproved(true);
        when(faqs.findById(7)).thenReturn(Optional.of(faq));
        AiFaqService service=new AiFaqService();
        ReflectionTestUtils.setField(service,"faqRepository",faqs);
        ReflectionTestUtils.setField(service,"inquiryRepository",inquiries);
        ReflectionTestUtils.setField(service,"llmService",llm);
        assertEquals(Map.of("faqNo",7,"question",faq.getQuestionText(),"answer",faq.getAnswerText()),service.answer(7));
        faq.setApproved(false);
        assertNull(service.answer(7));
        verifyNoInteractions(inquiries,llm);
        verify(faqs,never()).save(any());
    }

    @Test void guardianFaqHttpRequiresRoleAndRejectsUnapprovedAnswer() {
        AiFaqRepository faqs=mock(AiFaqRepository.class);
        AiFaqService service=new AiFaqService();
        ReflectionTestUtils.setField(service,"faqRepository",faqs);
        AuthChecker auth=mock(AuthChecker.class);
        when(auth.hasRole("guardian",1)).thenReturn(true);
        AiController controller=new AiController();
        ReflectionTestUtils.setField(controller,"authChecker",auth);
        ReflectionTestUtils.setField(controller,"faqService",service);
        assertEquals(403,assertThrows(ResponseStatusException.class,()->controller.answer(7,null)).getStatusCode().value());
        assertEquals(403,assertThrows(ResponseStatusException.class,()->controller.answer(7,"admin")).getStatusCode().value());
        assertEquals(404,assertThrows(ResponseStatusException.class,()->controller.answer(7,"guardian")).getStatusCode().value());
    }

    @Test void newQuestionIsSavedPendingWithoutUnapprovedAiAnswer() {
        GuardianRepository guardians=mock(GuardianRepository.class);
        InquiryCategoryRepository categories=mock(InquiryCategoryRepository.class);
        GuardianInquiryRepository inquiries=mock(GuardianInquiryRepository.class);
        LLMService llm=mock(LLMService.class);
        GuardianEntity guardian=GuardianEntity.builder().guardianNo(3).guardianState("use").build();
        InquiryCategoryEntity category=InquiryCategoryEntity.builder().inquiryCategoryNo(4).build();
        when(guardians.findByUserEntity_UserNo(12)).thenReturn(guardian);
        when(categories.findById(4)).thenReturn(Optional.of(category));
        when(inquiries.saveAndFlush(any())).thenAnswer(call->{
            GuardianInquiryEntity row=call.getArgument(0);
            assertNull(row.getAnswerContent());assertNull(row.getAnswerDate());
            row.setInquiryNo(21);return row;
        });
        AiInquiryService service=new AiInquiryService();
        ReflectionTestUtils.setField(service,"guardianRepository",guardians);
        ReflectionTestUtils.setField(service,"categoryRepository",categories);
        ReflectionTestUtils.setField(service,"inquiryRepository",inquiries);
        ReflectionTestUtils.setField(service,"llmService",llm);
        ReflectionTestUtils.setField(service,"faqRepository",mock(AiFaqRepository.class));
        Map<String,Object> result=service.answer(4,"새로운 질문",null,12);
        assertEquals(21,result.get("inquiryNo"));
        assertEquals(true,result.get("needsStaff"));
        assertEquals("응답 대기",result.get("status"));
        verifyNoInteractions(llm);
        verify(inquiries).saveAndFlush(any());
    }

    @Test void oldAiAnswerCannotBeUsedToGenerateFaq() {
        GuardianInquiryRepository inquiries=mock(GuardianInquiryRepository.class);
        AiFaqRepository faqs=mock(AiFaqRepository.class);
        LLMService llm=mock(LLMService.class);
        GuardianInquiryEntity row=new GuardianInquiryEntity();
        row.setInquiryContent("문의 내용");row.setAnswerContent("[AI 안내] 과거 자동 답변");
        when(inquiries.findById(1)).thenReturn(Optional.of(row));
        AiFaqService service=new AiFaqService();
        ReflectionTestUtils.setField(service,"inquiryRepository",inquiries);
        ReflectionTestUtils.setField(service,"faqRepository",faqs);
        ReflectionTestUtils.setField(service,"llmService",llm);
        assertThrows(IllegalArgumentException.class,()->service.generate(1));
        verifyNoInteractions(llm,faqs);
    }
}
