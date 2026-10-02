package oncare_backend.controller;

import java.util.List;

import oncare_backend.model.dto.AssignmentActionDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.CareworkerReportDto;
import oncare_backend.service.CareWorkerReportService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
    @GetMapping ("/center")
    public List<CareworkerReportDto> findAllByCenter(@RequestParam(name = "center_no") Integer centerNo){
        return careWorkerReportService.findAllByCenter(centerNo);
    }

    // [3] 요양보호사 별 근무기록 불러오기
    @GetMapping("/careworker")
    public List<CareworkerReportDto> findAllByCareworker(@RequestParam(name = "careworker_no") Integer careworkerNo) {
        return careWorkerReportService.findAllByCareworker(careworkerNo);
    }
    
    // [4] 근무 기록 레코드 -> 근무기록상태 바꾸기
    @PutMapping("")
    public boolean updateReport( @RequestParam(name="careworker_report_no")Integer careworkersReportNo,
                                 @RequestParam(name="work_status")String status ){
        return careWorkerReportService.updateReport(careworkersReportNo, status);
    }
    // [5] 근무 기록 삭제
    @DeleteMapping("")
    public boolean deleteReport( @RequestParam(name="careworker_report_no")Integer careworkersReportNo ){
        return careWorkerReportService.deleteReport(careworkersReportNo);
    }

    // 요양보호사 : 배정 수락
    @PutMapping("/accept")
    public boolean acceptAssignment(@RequestBody AssignmentActionDto assignmentActionDto){
        return careWorkerReportService.acceptAssignment(assignmentActionDto);
    }

    // 요양보호사 : 배정 거절
    @PutMapping("/reject")
    public boolean rejectAssignment(@RequestBody AssignmentActionDto assignmentActionDto){
        return careWorkerReportService.rejectAssignment(assignmentActionDto);
    }

}