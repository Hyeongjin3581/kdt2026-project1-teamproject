package oncare_backend.service;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.ChatMessageDto;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.ChatMessageEntity;
import oncare_backend.model.entity.UserEntity;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CareworkersRepository;
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
    private final CareWorkerReportRepository reportRepository;

    //[*] 메시지 저장, 저장된 메시지 dto로 다시 반환
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


    // [*] roomId로 과거 내역 오름차순으로 찾기
    public List<ChatMessageDto> findByRoom(String roomId){
        List<ChatMessageEntity> findByRoom = chatMessageRepository.findByRoomIdOrderByMessageNo(roomId);
        return findByRoom.stream().map(ChatMessageDto::entityToDto).toList();
    }


    // [*] userNo가 roomId에 들어갈 수 있는지 확인
    public boolean canEnter(String roomId, Integer userNo){
        if (roomId == null || userNo == null){
            return false;
        }
        // reportNo를 roomId로 씀 , roomId String으로 타입 설정해서 문자입력시 예외처리
        Integer reportNo = 0;
        try {
            reportNo = Integer.parseInt(roomId);
        } catch (Exception e){
            return false;
        }

        CareworkerReportEntity report = reportRepository.findById(reportNo).orElse(null);
        // 근무기록이 없거나 상태가 확정이 아닐때 false
        if (report == null || !"확정".equals(report.getWorkStatus())){
            return false;
        }

        // 요양보호사에 연결된 회원 번호 (로그인한 userNo와 비교할 값)
        Integer careUserNo = 0;
        if (report.getCareworkerEntity() != null && report.getCareworkerEntity().getUserEntity() != null){
            careUserNo = report.getCareworkerEntity().getUserEntity().getUserNo();
        }
        // 보호자에 연결된 회원 번호 (로그인한 userNo와 비교할 값)
        Integer guardUserNo = 0;
        if (report.getRequestEntity() != null && report.getRequestEntity().getCarerecipientEntity() != null
                && report.getRequestEntity().getCarerecipientEntity().getGuardianEntity() != null
                && report.getRequestEntity().getCarerecipientEntity().getGuardianEntity().getUserEntity() != null){
            guardUserNo = report.getRequestEntity().getCarerecipientEntity().getGuardianEntity().getUserEntity().getUserNo();
        }

        return userNo.equals(careUserNo) || userNo.equals(guardUserNo);
    }
}
