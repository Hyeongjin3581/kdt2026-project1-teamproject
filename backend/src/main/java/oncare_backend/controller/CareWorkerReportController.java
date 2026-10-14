package oncare_backend.controller;

import java.util.ArrayList;
import java.util.List;

import oncare_backend.model.dto.*;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CareworkersRepository;
import oncare_backend.model.repository.GuardianRepository;
import oncare_backend.model.repository.RequestRepository;
import oncare_backend.service.AuthChecker;
import oncare_backend.service.AutoAssignService;
import oncare_backend.service.JwtUtil;
import oncare_backend.service.NotifyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CookieValue;
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
    @Autowired private AutoAssignService autoAssignService;
    @Autowired private AuthChecker authChecker;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private CareworkersRepository careworkersRepository;
    @Autowired private GuardianRepository guardianRepository;
    @Autowired private CareWorkerReportRepository careWorkerReportRepository;
    @Autowired private RequestRepository requestRepository;
    @Autowired private NotifyService notifyService;

    // 로그인한 요양보호사 번호 조회
    private Integer getMyCareworkerNo(String accessToken) {
        if (!authChecker.hasRole(accessToken, 2)) return null;

        Integer userNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (userNo == null) return null;

        CareworkerEntity careworker = careworkersRepository.findByUserEntity_UserNo(userNo).orElse(null);
        if (careworker == null) return null;

        return careworker.getCareworkerNo();
    }

    // 로그인한 보호자 번호 조회
    private Integer getMyGuardianNo(String accessToken) {
        if (!authChecker.hasRole(accessToken, 1)) return null;

        Integer userNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (userNo == null) return null;

        GuardianEntity guardian = guardianRepository.findByUserEntity_UserNo(userNo);
        if (guardian == null) return null;

        return guardian.getGuardianNo();
    }

    // 로그인한 요양보호사 본인 근무기록 확인
    private boolean isMyReport(String accessToken, Integer reportNo) {
        Integer myCareworkerNo = getMyCareworkerNo(accessToken);
        if (myCareworkerNo == null || reportNo == null) return false;

        CareworkerReportEntity report = careWorkerReportRepository.findById(reportNo).orElse(null);
        if (report == null || report.getCareworkerEntity() == null) return false;

        return myCareworkerNo.equals(report.getCareworkerEntity().getCareworkerNo());
    }

    // [1] 근무기록 추가 - 관리자
    @PostMapping("")
    public boolean saveReport(@CookieValue(value = "accessToken", required = false)String token,
                              @RequestBody CareworkerReportDto careworkerReportDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }
        return careWorkerReportService.saveReport(careworkerReportDto);
    }

    // [2] 센터 별 근무기록 불러오기 --> 관리자, 보호자 화면이 사용하므로 로그인만 확인
    @GetMapping ("/center")
    public List<CareworkerReportDto> findAllByCenter(@CookieValue(value = "accessToken", required = false)String token,
                                                     @RequestParam(name = "centerNo") Integer centerNo){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        return careWorkerReportService.findAllByCenter(centerNo);
    }

    // [3] 요양보호사 별 근무기록 불러오기 --> 요양보호사, 관리자(상세 창)가 사용하므로 로그인만 확인
    @GetMapping("/careworker")
    public List<CareworkerReportDto> findAllByCareworker(@CookieValue(value = "accessToken", required = false)String token,
                                                         @RequestParam(name = "careworkerNo") Integer careworkerNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        return careWorkerReportService.findAllByCareworker(careworkerNo);
    }

    // [4] 근무 기록 레코드 -> 근무기록상태 바꾸기 --> 관리자(4)
    @PutMapping("")
    public boolean updateReport(@CookieValue(value = "accessToken", required = false)String token,
                                @RequestParam(name="careworkersReportNo")Integer careworkersReportNo,
                                @RequestParam(name="workStatus")String status ){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }
        return careWorkerReportService.updateReport(careworkersReportNo, status);
    }
    // [5] 근무 기록 삭제 --> 관리자(4)
    @DeleteMapping("")
    public boolean deleteReport(@CookieValue(value = "accessToken", required = false)String token,
                                @RequestParam(name="careworkersReportNo")Integer careworkersReportNo ){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }
        return careWorkerReportService.deleteReport(careworkersReportNo);
    }

    // 요양보호사(2) : 배정 수락
    @PutMapping("/accept")
    public boolean acceptAssignment(@CookieValue(value = "accessToken", required = false)String token,
                                    @RequestBody AssignmentActionDto assignmentActionDto){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,2)){
            return false;
        }
        return careWorkerReportService.acceptAssignment(assignmentActionDto);
    }

    // 요양보호사(2) : 배정 거절
    @PutMapping("/reject")
    public boolean rejectAssignment(@CookieValue(value = "accessToken", required = false)String token,
                                    @RequestBody AssignmentActionDto assignmentActionDto){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,2)){
            return false;
        }
        boolean result = careWorkerReportService.rejectAssignment(assignmentActionDto);
        if (result){
            notifyService.toAdmin(NotifyType.VACANCY,"요양보호사가 배정을 거절했습니다.");
        }
        return result;
    }

    // 관리자(4)가 상위 3명 중 한 명을 눌러 "배정하기"를 했을 때
    @PostMapping("/assign")
    public boolean assignCareworker(@CookieValue(value = "accessToken", required = false)String token,
                                    @RequestBody AssignCareworkerDto assignCareworkerDto){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }
        return careWorkerReportService.assignCareworker(assignCareworkerDto);
    }

    // 요양보호사(2)가 자기 페이지를 열었을 때 수락 대기 중인 배정을 보여 주는 조회
    @GetMapping("/findMyAssignments")
    public List<CareworkerReportDto> findMyAssignments(@CookieValue(value = "accessToken", required = false)String token,
                                                       @RequestParam Integer careworkerNo){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        if (!authChecker.hasRole(token,2)){
            return List.of();
        }
        return careWorkerReportService.findMyAssignments(careworkerNo);
    }

    // 관리자(4) : 요청 번호를 받아 필수 조건을 통과한 요양보호사 중 상위 3명을 반환
    @GetMapping("/candidates")
    public List<CareWorkerRecommendationDto> top3Careworkers(@CookieValue(value = "accessToken", required = false)String token,
                                                             @RequestParam("requestNo") Integer requestNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        if (!authChecker.hasRole(token,4)){
            return List.of();
        }
        return autoAssignService.top3Careworkers(requestNo);
    }

    // 관리자(4) : 요청 번호 받아 필수 조건을 통과한 요양보호사 List 반환
    @GetMapping("/available")
    public List<CareworkerDto> filterCareworkers(@CookieValue(value = "accessToken", required = false)String token,
                                                 @RequestParam Integer requestNo){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        if (!authChecker.hasRole(token,4)){
            return List.of();
        }
        return autoAssignService.filterCareworkers(requestNo);
    }
    // 요양보호사(2)별 확정된 요청 전체조회
    @GetMapping("/findMyConfirmed")
    public List<CareworkerReportDto> findMyConfirmed(@CookieValue(value = "accessToken", required = false)String token,
                                                     @RequestParam Integer careworkerNo){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        if (!authChecker.hasRole(token,2)){
            return List.of();
        }
        return careWorkerReportService.findMyConfirmed(careworkerNo);
    }

    // 요양보호사(2)가 확정된 요청을 거절
    @PutMapping("/cancel")
    public boolean cancel(@CookieValue(value = "accessToken", required = false)String token,
                          @RequestBody AssignmentActionDto assignmentActionDto){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,2)){
            return false;
        }
        boolean result = careWorkerReportService.cancel(assignmentActionDto);
        if (result){
            notifyService.toAdmin(NotifyType.VACANCY, "확정된 방문이 취소되었습니다.");
        }
        return result;
    }

    // 요양보호사(2) 확정된 요청을 완료
    @PutMapping("/complete")
    public boolean complete(@CookieValue(value = "accessToken", required = false)String token,
                            @RequestBody AssignmentActionDto assignmentActionDto){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,2)){
            return false;
        }
        return careWorkerReportService.complete(assignmentActionDto);
    }
}

