package oncare_backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import oncare_backend.model.dto.RequestDto;
import oncare_backend.model.entity.CareRecipientEntity;
import oncare_backend.model.entity.RequestEntity;
import oncare_backend.model.repository.CareRecipientRepository;
import oncare_backend.model.repository.RequestRepository;

@Service 
@Transactional 
public class RequestService {

    @Autowired private RequestRepository requestRepository;
    @Autowired private CareRecipientRepository careRecipientRepository;

    // [1] 서비스요청 추가
    // 수급자 식별을 위한 수급자 번호와, 요청 레코드를 담은 DTO를 새로 등록
    // Q. 수급자 번호를 매개변수로 입력해야 하는가? 
    public boolean saveRequest(RequestDto requestDto, Integer carerecipientNo){
        if (carerecipientNo == null) return false;

        // 1. dto -> entity
        RequestEntity entity = requestDto.dtoToEntity();

        // 2. FK 추가 (엔티티 주입)
        // 수급자 번호
        CareRecipientEntity careRecipientEntity = careRecipientRepository.findById(carerecipientNo).orElse(null);
        if (careRecipientEntity == null) return false;
        entity.setCarerecipientEntity(careRecipientEntity);

        // 3. 저장
        RequestEntity saved = requestRepository.save(entity);

        // 4. 결과 검사
        if (saved.getRequestNo() >= 1) {
            return true;
        }
        return false;
    }

    // *** 센터별 서비스 요청은 불가능!!! (연결점 없음)
    // [2] 수급자 별 서비스요청 출력
    public List<RequestDto> findAllByCareRecipients(Integer careRecipientNo){
        List<RequestEntity> entities = requestRepository.findByCarerecipientEntity_CareRecipientNo(careRecipientNo);

        List<RequestDto> list = new ArrayList<>();
        for( RequestEntity entity : entities ){
            RequestDto dto = RequestDto.entityToDto(entity);

            list.add(dto);
        }

        return list;
    }
    // [3] 보호자 별 서비스요청 출력
    public List<RequestDto> findAllByGuardians(Integer guardianNo){
        // 1. 보호자 고유번호로 서비스 요청 엔티티들 가져오기
        List<RequestEntity> entities = requestRepository.findByCarerecipientEntity_GuardianEntity_GuardianNo(guardianNo);

        // 2. entity -> dto
        List<RequestDto> list = new ArrayList<>();
        for(RequestEntity entity : entities) {
            RequestDto dto = RequestDto.entityToDto(entity);

            list.add(dto);
        }

        // 3. 반환
        return list;
    }
    // [4] 서비스 요청 수정
    public boolean updateRequest(Integer requestNo, RequestDto requestDto){
        // 1. id값으로 엔티티 탐색
        RequestEntity entity = requestRepository.findById(requestNo).orElse(null);
        if (entity == null) return false; 

        // 2. 입력한 DTO 값 -> Entity에 업데이트
        // 선호 요양보호사 성별 수정
        if (requestDto.getPreferredGender() != null) {
            entity.setPreferredGender(requestDto.getPreferredGender());
        }
        // 매칭서비스 상태 수정
        if (requestDto.getRequestState() != null) {
            entity.setRequestState(requestDto.getRequestState());
        }
        // 방문일정 수정
        if (requestDto.getVisitDate() != null) {
            entity.setVisitDate(requestDto.getVisitDate());
        }
        // 방문시작시간 수정
        if (requestDto.getVisitStartTime() != null) {
            entity.setVisitStartTime(requestDto.getVisitStartTime());
        }
        // 방문종료시간 수정
        if (requestDto.getVisitEndTime() != null) {
            entity.setVisitEndTime(requestDto.getVisitEndTime());
        }
        // 요청사항 수정
        if (requestDto.getRequestContent() != null) {
            entity.setRequestContent(requestDto.getRequestContent());
        }

        return true;
    }
    // [5] 서비스 요청 삭제
    public boolean deleteRequest(Integer requestNo){
        RequestEntity entity = requestRepository.findById(requestNo).orElse(null);

        if (entity == null) return false;
        requestRepository.deleteById(requestNo);

        return true;
    }
}
