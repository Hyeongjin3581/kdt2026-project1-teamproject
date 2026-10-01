package oncare_backend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.RequestEntity;
import oncare_backend.model.repository.RequestRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class AutoAssignService {
    private final RequestRepository requestRepository;

    // 상위 3명 추출 메소드
    public List<CareworkerEntity> top3Careworkers(Integer requestNo){
        // requesNo값으로 requestEntity 찾고 없으면 빈 배열 리턴
        RequestEntity requestEntity = requestRepository.findById(requestNo).orElse(null);
        if (requestEntity == null){
            return new ArrayList<>();
        }

        // 필수 조건 필터 메소드 호출해서 배정가능한 요양보호사 받기
        List<CareworkerEntity> careworkerEntities = filterCareworker(requestEntity);
        return new ArrayList<>();
    }

    // 필수 조건 필터 메소드
    private List<CareworkerEntity> filterCareworker(RequestEntity requestEntity){

    }
}
