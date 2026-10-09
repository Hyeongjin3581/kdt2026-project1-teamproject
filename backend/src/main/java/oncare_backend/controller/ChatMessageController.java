package oncare_backend.controller;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.ChatMessageDto;
import oncare_backend.service.ChatMessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatMessageController {
    private final SimpMessageSendingOperations messageTemp; // 메시지 보내는 도구 , 방송을 내보내는 마이크
    private final ChatMessageService chatMessageService;

    @MessageMapping("/chat/message")    // 실제 목적지 = /pub + /chat/message , 접수 창구 번호
    // SimpMessageHeaderAccessor : 메시지 헤더 읽기
    public void message(ChatMessageDto chatMessageDto, SimpMessageHeaderAccessor headerAccessor){
        // handshake 때 넣어둔 userNo , attributes에서 꺼냄
        Integer userNo = (Integer)headerAccessor.getSessionAttributes().get("userNo");
        if (userNo == null){
            return;
        }
        // *** 전송하기전에 먼저 DB에 저장 ***
        ChatMessageDto saved = chatMessageService.save(chatMessageDto,userNo);
        if (saved == null){
            return;
        }
        // 같은 방 구독 중인 사람에게 전송 + 저장된 dto값을 전송
        messageTemp.convertAndSend("/sub/chat/room/" + chatMessageDto.getRoomId(), saved);
    }
}
