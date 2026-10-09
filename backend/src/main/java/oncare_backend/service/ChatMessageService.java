package oncare_backend.service;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.ChatMessageDto;
import oncare_backend.model.entity.ChatMessageEntity;
import oncare_backend.model.entity.UserEntity;
import oncare_backend.model.repository.ChatMessageRepository;
import oncare_backend.model.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    // 메시지 저장, 저장된 메시지 dto로 다시 반환
    public ChatMessageDto save(ChatMessageDto messageDto, Integer userNo){
        UserEntity user = userRepository.findById(userNo).orElse(null);
        if (user == null){
            return null;
        }
        messageDto.setSenderNo(userNo);
        messageDto.setSender(user.getUserId()); // 화면에 보일 이름
        ChatMessageEntity saved = chatMessageRepository.save(messageDto.dtoToEntity());
        return ChatMessageDto.entityToDto(saved);
    }

    // roomId로 과거 내역 오름차순으로 찾기
    public List<ChatMessageDto> findByRoom(String roomId){
        List<ChatMessageEntity> findByRoom = chatMessageRepository.findByRoomIdOrderByMessageNo(roomId);
        return findByRoom.stream().map(ChatMessageDto::entityToDto).toList();
    }
}
