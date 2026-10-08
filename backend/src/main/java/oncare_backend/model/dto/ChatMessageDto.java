package oncare_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.ChatMessageEntity;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessageDto {
    private Integer messageNo; // 메시지 번호 PK

    private String roomId; // 방번호
    private String sender; // 보낸 사람
    private String content; // 내용
    private String date; // 보낸 시간

    public ChatMessageEntity dtoToEntity(){
        return ChatMessageEntity.builder()
                .roomId(roomId)
                .sender(sender)
                .content(content)
                .build();
    }

    public static ChatMessageDto entityToDto(ChatMessageEntity chatMessage){
        return ChatMessageDto.builder()
                .messageNo(chatMessage.getMessageNo())
                .roomId(chatMessage.getRoomId())
                .sender(chatMessage.getSender())
                .content(chatMessage.getContent())
                .date(chatMessage.getCreateDate()
                        .format(DateTimeFormatter.ofPattern("a h:mm", Locale.KOREA))) // EX) "오후 3:05" -> 프론트용으로 변환
                .build();
    }
}
