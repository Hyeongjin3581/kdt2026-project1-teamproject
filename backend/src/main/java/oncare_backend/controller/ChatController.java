package oncare_backend.controller;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.ChatMessageDto;
import oncare_backend.service.ChatMessageService;
import oncare_backend.service.JwtUtil;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/chat")
public class ChatController {
    private final ChatMessageService chatMessageService;
    private final JwtUtil jwtUtil;

    @GetMapping("/messages")
    public List<ChatMessageDto> findByRoom(@RequestParam String roomId,
                                           @CookieValue(value = "accessToken",required = false)String accessToken){
        // 1. 로그인 확인
        Integer userNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (userNo == null){
            return null;
        }

        // 2. 이 방 당사자인지 확인
        if (!chatMessageService.canEnter(roomId, userNo)){
            return null;
        }

        // 3. 다 통과되면 과거 대화 반환
        return chatMessageService.findByRoom(roomId);
    }
}
