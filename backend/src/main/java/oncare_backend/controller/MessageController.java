package oncare_backend.controller;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.MessageDto;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class MessageController {
    private final SimpMessageSendingOperations messageTemp; // 메시지 보내는 도구 , 방송을 내보내는 마이크

    @MessageMapping("/chat/message")    // 실제 목적지 = /pub + /chat/message , 접수 창구 번호
    public void message(MessageDto messageDto){
        // 같은 방 구독 중인 사람에게 전송
        messageTemp.convertAndSend("/sub/chat/room/" + messageDto.getRoomId(), messageDto);
    }
}
