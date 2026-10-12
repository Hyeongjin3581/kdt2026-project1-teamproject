package oncare_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
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
@EnableWebSocketMessageBroker // STOMP 브로커 기능 켜기
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final ChatHandshakeInterceptor chatHandshakeInterceptor;
    private final ChatSubInterceptor chatSubInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/sub"); // 구독 주소 -> 받는 사람 , 구독자 전원에게 배달
        registry.setApplicationDestinationPrefixes("/pub"); // 발행 주소 -> 보내는 사람 , 접수 창구
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat") // 소켓 연결 주소
                .addInterceptors(chatHandshakeInterceptor) // /ws-chat으로 오는 연결 chatHandshakeInterceptor 여기서 토큰 검사
                .setAllowedOriginPatterns("http://localhost:5173"); // CORS : 이주소 프론트(리액트) 에서 오는것만 연결 허용
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(chatSubInterceptor);
    }
}
