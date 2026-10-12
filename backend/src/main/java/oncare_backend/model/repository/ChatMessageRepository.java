package oncare_backend.model.repository;

import oncare_backend.model.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Integer> {
    // roomID로 CahtMeeageEntity 찾기 , messageNo로 오름차순 정렬 , 디폴트 -> 오름차순
    List<ChatMessageEntity> findByRoomIdOrderByMessageNo(String roomId);
}
