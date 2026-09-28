package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.CareworkerReportDto;
import oncare_backend.service.CareWorkerReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController 
@RequestMapping ("/careworkerreport")
public class CareWorkerReportController {
    @Autowired private CareWorkerReportService careWorkerReportService;

    // [1] 근무기록 추가
    @PostMapping("")
    public boolean saveReport(@RequestBody CareworkerReportDto careworkerReportDto) {
        return careWorkerReportService.saveReport(careworkerReportDto);
    }
    
    // [2] 센터 별 근무기록 불러오기
    @GetMapping ("")
    public List<CareworkerReportDto> findAllByCenter(@RequestParam(name = "center_no") Integer centerNo){
        return findAllByCenter(centerNo);
    }
}
