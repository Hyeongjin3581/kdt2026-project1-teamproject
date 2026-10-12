package oncare_backend.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import oncare_backend.service.JwtUtil;
import org.jspecify.annotations.Nullable;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/*
        브라우저 ──HTTP 요청(쿠키 포함)──▶ [ChatHandshakeInterceptor] ──통과──▶ 웹소켓 연결 성립
                                                 │
                                                 └─ 실패(false)면 여기서 거부
 */

@Component
@RequiredArgsConstructor
public class ChatHandshakeInterceptor implements HandshakeInterceptor {
    private final JwtUtil jwtUtil;

    // 연결 허락 직전 호출
    // request -> 들어온요청 (쿠키 꺼내기)
    // response -> 돌려줄 응답 (여기선 안씀) , wsHandler -> 웹소켓 처리기 (여기선 안씀)
    // attributes -> 이 연결 전용 보관함 연결이 살아있는 동안 계속 사용가능 (Map 타입)
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) {

        // 들어온 요청이 ServletServerHttpRequest 타입이 맞는지 확인 , 맞으면 ServletServerHttpRequest 타입 servletRequest 변수 선언
        if (!(request instanceof ServletServerHttpRequest servletRequest)){
            return false;
        }
        // getServletRequest() -> 포장 벗겨서 진짜 HttpServletRequest 획득
        /*┌─ ServletServerHttpRequest (스프링이 만든 포장지) ────────┐
          │                                                       │
          │    ┌─ HttpServletRequest (Tomcat이 만든 진짜 요청)  ─┐   │
          │    │   쿠키, 헤더, 파라미터 등이 여기 들어 있음         │   │
          │    └──────────────────────────────────────────────┘   │
          └───────────────────────────────────────────────────────┘*/
        HttpServletRequest httpRequest = servletRequest.getServletRequest();

        String token = null;
        // 브라우저가 보낸 모든 쿠키 배열로 받기
        Cookie[] cookies = httpRequest.getCookies();
        if (cookies != null){
            for (Cookie cookie : cookies) {
                // 배열을 뒤져서 accessToken 찾고 token변수에 담기
                if ("accessToken".equals(cookie.getName())){
                    token = cookie.getValue();
                }
            }
        }
        // 토큰 없으면 거부
        if (token == null){
            return false;
        }

        // 찾은 토큰 내가만든 jwtUtil.getUserNoFromAccessToken 메소드로 검증
        Integer userNo = jwtUtil.getUserNoFromAccessToken(token);
        if (userNo == null){
            return false;
        }

        // 연결보관함 attributes에 userNo 저장
        attributes.put("userNo",userNo);
        System.out.println("웹소켓 연결 : userNo=" + userNo);
        return true;
    }

    // 연결이 된후 호출됨 , interface의 추상메소드라 구현은 해야됨 아니면 오류
    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, @Nullable Exception exception) {

    }
}
