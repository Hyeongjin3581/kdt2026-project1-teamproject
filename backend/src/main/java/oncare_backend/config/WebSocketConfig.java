package oncare_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/*
/ws-chat   = 건물 현관문 (한 번 들어오면 계속 연결 유지)
/pub/...   = 안내 데스크에 메시지를 맡김 (서버 컨트롤러가 받음)
/sub/...   = 방송을 듣는 스피커 (구독한 사람 전원에게 배달)
*/

@Configuration
@EnableWebSocketMessageBroker // 스톰 브로커 기능 켜기
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/sub"); // 구독 주소 -> 받는 사람 , 구독자 전원에게 배달
        registry.setApplicationDestinationPrefixes("/pub"); // 발행 주소 -> 보내는 사람 , 접수 창구
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat") // 소켓 연결 주소
                .setAllowedOriginPatterns("*"); // CORS : 모든 도메인 허용
    }
}
