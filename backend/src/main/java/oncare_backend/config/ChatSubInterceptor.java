package oncare_backend.config;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.UserDto;
import oncare_backend.service.ChatMessageService;
import oncare_backend.service.UserService;
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
    private final UserService userService;

    // 메시지 브로커로 들어가기 직전에 호출 -> preSend
    // Message<?> -> 지나가는 메시지 한 통 , MessageChannel -> 메시지 지나가는 통로 , 여기선 안쓰임
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
        if (destination == null || accessor.getSessionAttributes() == null){
            return null;
        }
        Integer no = (Integer) accessor.getSessionAttributes().get("userNo");

        // 분기1. 관리자 알림 채널 => 관리자가 아니면 알림 X
        if (destination.startsWith("/sub/admin/")){
            UserDto me = userService.findById(no);
            if ( me == null || me.getUserCategoryNo() != 4){
                return null;
            }
            return message;
        }

        // 분기2. 기존 채팅방 그대로
        String prefix = "/sub/chat/room/";
        // 채팅방 주소가 아니면 거부
        if (destination.startsWith(prefix)){
            // prefix만큼 길이 잘라서 roomId값만 추출
            String roomId = destination.substring(prefix.length());
            if (chatMessageService.canEnter(roomId,no)){
                return message;
            }
            return null;
        }

        return null;
    }
}
