package oncare_backend.controller;

import java.util.List;

import oncare_backend.model.dto.*;
import oncare_backend.model.repository.RequestRepository;
import oncare_backend.service.AutoAssignService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

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
    @Autowired private  AutoAssignService autoAssignService;

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

    // 관리자가 상위 3명 중 한 명을 눌러 "배정하기"를 했을 때
    @PostMapping("/assign")
    public boolean assignCareworker(@RequestBody AssignCareworkerDto assignCareworkerDto){
        return careWorkerReportService.assignCareworker(assignCareworkerDto);
    }

    // 요양보호사가 자기 페이지를 열었을 때 수락 대기 중인 배정을 보여 주는 조회
    @GetMapping("/findMyAssignments")
    public List<CareworkerReportDto> findMyAssignments(@RequestParam Integer carworkerNo){
        return careWorkerReportService.findMyAssignments(carworkerNo);
    }

    // 요청 번호를 받아 필수 조건을 통과한 요양보호사 중 상위 3명을 반환
    @GetMapping("/candidates")
    public List<CareWorkerRecommendationDto> candidates(@RequestParam("request_no") Integer requestNo) {
        return autoAssignService.top3Careworkers(requestNo);
    }

    // 요청 번호 받아 필수 조건을 통과한 요양보호사 List 반환
    @GetMapping("/available")
    public List<CareworkerDto> availableCareworker(@RequestParam Integer requestNo){
        return autoAssignService.filterCareworkers(requestNo);
    }
    // 요양보호사별 확정된 요청 전체조회
    @GetMapping("/findMyConfirmed")
    public List<CareworkerReportDto> findMyConfirmed(@RequestParam Integer careworkerNo){
        return careWorkerReportService.findMyConfirmed(careworkerNo);
    }

    // 요양보호사가 확정된 요청을 거절
    @PutMapping("/cancel")
    public boolean cancel(@RequestBody AssignmentActionDto assignmentActionDto){
        return careWorkerReportService.cancel(assignmentActionDto);
    }

    // 요양보호사 확정된 요청을 완료
    @PutMapping("/complete")
    public boolean complete(@RequestBody AssignmentActionDto assignmentActionDto){
        return careWorkerReportService.complete(assignmentActionDto);
    }
}