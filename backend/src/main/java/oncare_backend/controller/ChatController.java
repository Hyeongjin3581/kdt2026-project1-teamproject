package oncare_backend.controller;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.ChatMessageDto;
import oncare_backend.service.ChatMessageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/chat")
public class ChatController {
    private final ChatMessageService chatMessageService;

    @GetMapping("/messages")
    public List<ChatMessageDto> findByRoom(@RequestParam String roomId){
        return chatMessageService.findByRoom(roomId);
    }
}
