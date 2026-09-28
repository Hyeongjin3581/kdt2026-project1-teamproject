package oncare_backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.GetMapping;

import oncare_backend.model.dto.CareworkerReportDto;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.RequestEntity;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CareWorkerRepository;
import oncare_backend.model.repository.RequestRepository;

@Repository
public class CareWorkerReportService{

    @Autowired private CareWorkerReportRepository careWorkerReportRepository;
    @Autowired private CareWorkerRepository careWorkerRepository;
    @Autowired private RequestRepository requestRepository;
    

    // [1] 근무기록 생성
    public boolean saveReport(CareworkerReportDto careworkerReportDto) {
        // 1. dto -> entity
        CareworkerReportEntity entity = careworkerReportDto.dtoToEntity();

        // 2. FK 넣기
        // 요양보호사 번호 FK(careworker_no)
        CareworkerEntity careworkerEntity = careWorkerRepository.findById(careworkerReportDto.getCareworkerNo() ).orElse(null);
        entity.setCareworker(careworkerEntity);

        // 서비스요청 번호 FK(request_no)
        RequestEntity requestEntity = requestRepository.findById(careworkerReportDto.getRequestNo()).orElse(null);
        entity.setRequest(requestEntity);

        // 3. 저장
        CareworkerReportEntity saved = careWorkerReportRepository.save(entity);

        // 4. 결과 검사
        if (saved.getCareworkersReportNo() >= 1) {
            return true;
        }
        return false;
    }
}
