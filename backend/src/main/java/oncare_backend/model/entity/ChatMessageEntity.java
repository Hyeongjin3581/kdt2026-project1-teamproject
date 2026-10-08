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

    private String roomId;
    private String sender;
    private String content;
}
