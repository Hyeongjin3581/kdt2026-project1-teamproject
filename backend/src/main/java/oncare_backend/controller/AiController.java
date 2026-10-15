
package oncare_backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import oncare_backend.service.AiFaqService;
import oncare_backend.service.AuthChecker;
import oncare_backend.service.ReviewSentimentService;
import oncare_backend.service.AiInquiryService;
import oncare_backend.service.JwtUtil;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired private AuthChecker authChecker;
    @Autowired private ReviewSentimentService sentimentService;
    @Autowired private AiFaqService faqService;
    @Autowired private AiInquiryService inquiryService;
    @Autowired private JwtUtil jwtUtil;

    // [1] 보호자 문의 유형별 AI 질문 초안 생성
    @PostMapping("/inquiries/drafts")
    public Map<String, Object> inquiryDrafts(
            @RequestParam(name = "inquiryCategoryNo") Integer categoryNo,
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 1))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        try {
            Integer userNo = jwtUtil.getUserNoFromAccessToken(token);
            return inquiryService.drafts(categoryNo, userNo);

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 질문 초안 생성 실패");
        }
    }

    // [2] 일반 상담은 승인 FAQ로 답변 완료, 근거가 없거나 개인별 처리가 필요하면 응답 대기로 등록
    @PostMapping("/inquiries/answer")
    public Map<String, Object> inquiryAnswer(
            @RequestBody Map<String, String> body,
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 1))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        try {
            Integer categoryNo = Integer.valueOf(body.get("inquiryCategoryNo"));
            Integer requestNo = null;

            if (body.get("requestNo") != null && !body.get("requestNo").isBlank()) {
                requestNo = Integer.valueOf(body.get("requestNo"));
            }

            String question = body.get("question");
            Integer userNo = jwtUtil.getUserNoFromAccessToken(token);

            return inquiryService.answer(categoryNo, question, requestNo, userNo);

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 문의 답변 실패");
        }
    }

    // 새 화면용: 상담 분기만 반환하며 문의/일정은 저장하지 않는다.
    @PostMapping("/inquiries/consult")
    public Map<String, Object> consult(@RequestBody Map<String, String> body,
            @CookieValue(value = "accessToken", required = false) String token) {
        if (!authChecker.hasRole(token, 1)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        try {
            Integer requestNo = body.get("requestNo") == null || body.get("requestNo").isBlank()
                    ? null : Integer.valueOf(body.get("requestNo"));
            return inquiryService.consult(body.get("question"), requestNo, jwtUtil.getUserNoFromAccessToken(token));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 상담 실패");
        }
    }

    // 사용자의 명시적인 접수 요청만 처리한다. requestId를 재사용하면 기존 접수를 반환한다.
    @PostMapping("/inquiries/handoff")
    public Map<String, Object> handoff(@RequestBody Map<String, String> body,
            @CookieValue(value = "accessToken", required = false) String token) {
        if (!authChecker.hasRole(token, 1)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        try {
            Integer requestNo = body.get("requestNo") == null || body.get("requestNo").isBlank()
                    ? null : Integer.valueOf(body.get("requestNo"));
            return inquiryService.handoff(body.get("question"), requestNo, body.get("requestId"), jwtUtil.getUserNoFromAccessToken(token));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (ResponseStatusException e) {
            throw e; // 같은 키에 다른 내용: 409를 502로 바꾸지 않는다.
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "센터 문의 접수 실패");
        }
    }

    // [3] 시스템 관리자 후기 전체 조회
    @GetMapping("/reviews")
    public List<Map<String, Object>> reviews(
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 4))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        return sentimentService.reviews();
    }

    // [4] 후기 한 건 AI 감정 분석
    @PostMapping("/reviews/analyze")
    public Map<String, Object> analyze(
            @RequestParam(name = "reviewNo") Integer reviewNo,
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 4))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        try {
            return sentimentService.analyze(reviewNo);

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini 감정 분석 실패");
        }
    }

    // [5] 미분석 후기 최대 10건 분석
    @PostMapping("/reviews/analyze-pending")
    public List<Map<String, Object>> analyzePending(
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 4))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        return sentimentService.analyzePending();
    }

    // [6] 후기 감정 분석 통계 조회
    @GetMapping("/reviews/stats")
    public Map<String, Object> stats(
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 4))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        return sentimentService.stats();
    }

    // [7] DB에 답변이 있는 문의로 FAQ 질문 생성
    @PostMapping("/faq/generate")
    public Map<String, Object> generateFaq(
            @RequestParam(name = "inquiryNo") Integer inquiryNo,
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 4))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        try {
            return faqService.generate(inquiryNo);

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());

        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini FAQ 질문 생성 실패");
        }
    }

    // [8] 관리자 FAQ 전체 목록 조회
    @GetMapping("/faq/admin")
    public List<Map<String, Object>> adminFaqs(
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 4))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        return faqService.adminList();
    }

    // [9] 관리자 FAQ 질문 및 답변 수정
    @PutMapping("/faq/{faqNo}")
    public boolean editFaq(
            @PathVariable(name = "faqNo") Integer faqNo,
            @RequestBody Map<String, String> body,
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 4))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        return faqService.edit(faqNo, body.get("question"), body.get("answer"));
    }

    // [10] 관리자 FAQ 공개 승인 또는 해제
    @PutMapping("/faq/{faqNo}/approve")
    public boolean approveFaq(
            @PathVariable(name = "faqNo") Integer faqNo,
            @RequestParam(name = "approved") boolean approved,
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 4))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        return faqService.approve(faqNo, approved);
    }

    // [11] 보호자에게 승인된 FAQ 질문 목록 제공
    @GetMapping("/faq")
    public List<Map<String, Object>> questions(
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 1))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        return faqService.questions();
    }

    // [12] 보호자가 선택한 FAQ 답변 조회
    @GetMapping("/faq/{faqNo}/answer")
    public Map<String, Object> answer(
            @PathVariable(name = "faqNo") Integer faqNo,
            @CookieValue(value = "accessToken", required = false) String token) {

        if (!authChecker.hasRole(token, 1))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        Map<String, Object> result = faqService.answer(faqNo);

        if (result == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);

        return result;
    }
}
