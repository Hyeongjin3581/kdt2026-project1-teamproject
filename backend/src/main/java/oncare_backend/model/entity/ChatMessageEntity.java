package oncare_backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chatmessage")
@NoArgsConstructor @AllArgsConstructor @Data @Builder
public class ChatMessageEntity extends BaseTime{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer messageNo;

    private Integer senderNo; // 보낸 사람 회원번호
    private String sender; // 화면에 보일 이름
    private String roomId;
    private String content;
}
