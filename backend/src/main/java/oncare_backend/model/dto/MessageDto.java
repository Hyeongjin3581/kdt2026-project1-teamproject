package oncare_backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageDto {

    private String roomId; // 방번호
    private String sender; // 보낸 사람
    private String content; // 내용
    private String date; // 보낸 시간
}
