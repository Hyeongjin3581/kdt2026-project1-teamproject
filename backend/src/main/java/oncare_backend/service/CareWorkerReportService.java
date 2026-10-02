package oncare_backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import oncare_backend.model.dto.AssignmentActionDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


import oncare_backend.model.dto.CareworkerReportDto;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.RequestEntity;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CareWorkerRepository;
import oncare_backend.model.repository.RequestRepository;

@Service
@Transactional 
public class CareWorkerReportService{

    @Autowired private CareWorkerReportRepository careWorkerReportRepository;
    @Autowired private CareWorkerRepository careWorkerRepository;
    @Autowired private RequestRepository requestRepository;
    

    // [1] 근무기록 생성
    public boolean saveReport(CareworkerReportDto careworkerReportDto) {
        if (careworkerReportDto.getCareworkerNo() == null || careworkerReportDto.getRequestNo() == null) return false;

        // 1. dto -> entity
        CareworkerReportEntity entity = careworkerReportDto.dtoToEntity();

        // 2. FK 추가 (엔티티 주입)
        // 요양보호사 번호 FK(careworker_no)
        CareworkerEntity careworkerEntity = careWorkerRepository.findById(careworkerReportDto.getCareworkerNo() ).orElse(null);
        if (careworkerEntity == null) return false;
        entity.setCareworkerEntity(careworkerEntity);

        // 서비스요청 번호 FK(request_no)
        RequestEntity requestEntity = requestRepository.findById(careworkerReportDto.getRequestNo()).orElse(null);
        if (requestEntity == null) return false;
        entity.setRequestEntity(requestEntity);

        // 3. 저장
        CareworkerReportEntity saved = careWorkerReportRepository.save(entity);

        // 4. 결과 검사
        if (saved.getCareworkersReportNo() >= 1) {
            return true;
        }
        return false;
    }

    // [2] 센터 별 근무기록 불러오기
    public List<CareworkerReportDto> findAllByCenter(Integer centerNo){
        // 1. 요양보호사 엔티티 안 -> 센터엔티티의 센터번호로 해당 센터의 요양보호사 근무기록 가져오기
        List<CareworkerReportEntity> entities = careWorkerReportRepository.findByCareworkerEntity_CenterEntity_CenterNo(centerNo);

        // 2. 뽑아온 entity -> dto화 한 후 배열에 저장
        List<CareworkerReportDto> list = new ArrayList<>();
        for (CareworkerReportEntity entity : entities) {
            CareworkerReportDto dto = CareworkerReportDto.entityToDto(entity);
            list.add(dto);
        }

        // 3. 반환
        return list;
    }

    // [3] 요양보호사 별 근무기록
    public List<CareworkerReportDto> findAllByCareworker(Integer careworkerNo){
        // 1. 해당 요양보호사의 근무기록 엔티티 모두 찾아옴
        List<CareworkerReportEntity> entities = careWorkerReportRepository.findByCareworkerEntity_CareworkerNo(careworkerNo);

        // 2. 엔티티들을 dto화하여 배열에 저장하기
        List<CareworkerReportDto> list = new ArrayList<>();
        for(CareworkerReportEntity entity : entities){
            CareworkerReportDto dto = CareworkerReportDto.entityToDto(entity);
            list.add(dto);
        }

        return list;
    }

    // [4] 근무 기록 레코드 -> 근무기록상태 바꾸기
    public boolean updateReport(Integer careworkersReportNo, String status){
        // * 근무상태가 비어있으면 false 처리
        if (status == null) return false;
        
        // 1. 해당하는 엔티티 하나 뽑아오기
        CareworkerReportEntity entity = careWorkerReportRepository.findById(careworkersReportNo).orElse(null);
        if (entity == null) return false;
        
        // 2. 엔티티 중 근무상태 값 변경
        entity.setWorkStatus(status);

        return true;
    }

    // [5] 근무 기록 삭제
    public boolean deleteReport( Integer careworkersReportNo ){
        CareworkerReportEntity entity = careWorkerReportRepository.findById(careworkersReportNo).orElse(null);

        if (entity == null) return false;

        careWorkerReportRepository.deleteById(careworkersReportNo);

        return true;
    }

    // 요양보호사 : 배정 수락
    public boolean acceptAssignment(AssignmentActionDto assignmentActionDto) {
        // 근무기록에서 넘버로 조회해서 요양보호사가 수락하면 근무기록의 상태는 확정, 요청의 상태는 배정완료
        CareworkerReportEntity reportEntity = careWorkerReportRepository.findById(assignmentActionDto.getCareworkersReportNo()).orElse(null);
        if (reportEntity == null){
            return false;
        }
        // 수락을 기다리는 "배정" 상태일 때만 수락할 수 있음
        if (!"배정".equals(reportEntity.getWorkStatus())){
            return false;
        }
        reportEntity.setWorkStatus("확정");                           // 근무기록
        reportEntity.getRequestEntity().setRequestState("배정완료");   // 요청
        return true;
    }

    // 요양보호사 : 배정 거절
    public boolean rejectAssignment(AssignmentActionDto assignmentActionDto) {
        // 근무기록에서 넘버로 조회해서 요양보호사가 거절하면 근무기록은 취소, 요청은 신청으로 복귀
        CareworkerReportEntity reportEntity = careWorkerReportRepository.findById(assignmentActionDto.getCareworkersReportNo()).orElse(null);
        if (reportEntity == null){
            return false;
        }
        // 수락을 기다리는 "배정" 상태일 때만 취소할 수 있음
        if (!"배정".equals(reportEntity.getWorkStatus())){
            return false;
        }
        reportEntity.setWorkStatus("취소");                           // 근무기록
        reportEntity.getRequestEntity().setRequestState("신청");   // 요청
        return true;
    }

}