package oncare_backend.config;

import lombok.RequiredArgsConstructor;
import oncare_backend.service.ChatMessageService;
import org.jspecify.annotations.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatSubInterceptor implements ChannelInterceptor {
    private final ChatMessageService chatMessageService;

    // 메시지 브로커로 들어가기 직전에 호출 -> preSend
    // Message<?> -> 지나가는 메시지 한 통 , MessageChannerl -> 메시지 지나가는 통로 , 여기선 안쓰임
    @Override
    public @Nullable Message<?> preSend(Message<?> message, MessageChannel channel) {
        // 메시지 헤더(명령, 목적지, 세션 정보)를 쉽게 꺼내 쓰기 위해 STOMP 전용 도구로 감쌈 -> getCommand(), getDestination()등에 사용
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // 구독 요청이 아니면 검사하지않고 통과 , getCommand() -> 메시지 종류(CONNECT, SUBSCRIBE, SEND, UNSUBSCRIBE, DISCONNECT)
        if (!StompCommand.SUBSCRIBE.equals(accessor.getCommand())){
            return message;
        }

        // getDestination() -> 목적지 주소 반환
        String destination = accessor.getDestination();
        String prefix = "/sub/chat/room/";
        // 채팅방 주소가 아니면 거부
        if (destination == null || !destination.startsWith(prefix)){
            return null;
        }

        // prefix만큼 길이 잘라서 roomId값만 추출
        String roomId = destination.substring(prefix.length());
        // ChatHandshakeInterceptor에서 저장한 attributes에서 userNo값 추출
        Integer userNo = (Integer)accessor.getSessionAttributes().get("userNo");

        // 추출한 값을 canEnter에 넘겻 유효성 검사
        if (!chatMessageService.canEnter(roomId, userNo)){
            return null;
        }

        return message;
    }
}
