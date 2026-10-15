package oncare_backend.service;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import tools.jackson.databind.JsonNode;

// 공통 AI 통신 객체: 후기/문의/FAQ Service가 프롬프트를 전달하면 Gemini 답변 문장을 돌려준다.
@Service
public class LLMService {

    // @Value: application.properties의 값을 가져온다. 키를 Java 코드에 직접 적지 않는다.
    // 모델 설정이 없으면 콜론(:) 뒤의 기본 모델명을 사용한다.
    @Value("${api.gemini-key}") private String geminiApiKey;
    @Value("${api.gemini-model:gemini-3.5-flash-lite}") private String model;
    // 외부 HTTP 요청을 보내는 객체. 여기서는 기존 프로젝트의 WebClient를 그대로 사용한다.
    private final WebClient webClient = WebClient.builder().build();

    // 수업의 LLMCall()과 동일한 역할: 프롬프트 -> Gemini -> 텍스트
    public String LLMCall(String prompt) {
        // 1. AI에게 전달할 내용이 없으면 요청하지 않고 입력 오류로 처리한다.
        if (prompt == null || prompt.isBlank()) throw new IllegalArgumentException("프롬프트가 비었습니다.");

        // 2. Gemini가 요구하는 JSON 구조를 Map/List로 만든다.
        // contents[0] -> parts[0] -> text 안에 프롬프트 문자열이 들어간다.
        Map<String, Object> body = Map.of("contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))));

        // 3. 모델 주소로 POST 요청을 보낸다. 키는 인증 헤더에 넣고 본문은 JSON으로 보낸다.
        // bodyToMono: 응답을 JsonNode로 변환, block: 최대 30초 동안 결과를 기다린다.
        // HTTP 오류/시간 초과는 호출한 Service/Controller까지 예외로 전달된다.
        JsonNode response = webClient.post()
                .uri("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", model)
                .header("x-goog-api-key", geminiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block(Duration.ofSeconds(30));

        // 4. 응답의 첫 번째 후보/첫 번째 text를 꺼낸다. JsonNode.at은 JSON 경로로 접근한다.
        // 현재 코드가 읽는 경로: candidates[0].content.parts[0].text
        if (response == null) throw new IllegalStateException("Gemini 응답이 없습니다.");
        String result = response.at("/candidates/0/content/parts/0/text").asText();
        if (result.isBlank()) throw new IllegalStateException("Gemini 응답 문장이 없습니다.");
        // 5. 앞뒤 공백을 제거한 문자열만 반환한다. DB 저장은 이 클래스에서 하지 않는다.
        return result.trim();
    }
}
