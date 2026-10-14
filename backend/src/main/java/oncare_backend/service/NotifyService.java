package oncare_backend.service;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.NotifyDto;
import oncare_backend.model.dto.NotifyType;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotifyService {
    private final SimpMessageSendingOperations messageTemp;

    // 관리자에게 알람
    public void toAdmin(NotifyType type, String message){
        // /sub/admin/notify에 구독된 사람에게 전달 -> NotifyDto
        messageTemp.convertAndSend("/sub/admin/notify",
                NotifyDto.builder()
                        .type(type)
                        .message(message).build());
    }
}
