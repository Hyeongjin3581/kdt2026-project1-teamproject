
package oncare_backend.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import oncare_backend.model.dto.*;
import oncare_backend.model.entity.*;
import oncare_backend.model.repository.*;
import oncare_backend.service.*;

@RestController
@RequestMapping("/careworkerreport")
@Transactional
public class CareWorkerReportController {

    @Autowired private CareWorkerReportService careWorkerReportService;
    @Autowired private AutoAssignService autoAssignService;
    @Autowired private AuthChecker authChecker;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private CareworkersRepository careworkersRepository;
    @Autowired private GuardianRepository guardianRepository;
    @Autowired private CareWorkerReportRepository careWorkerReportRepository;
    @Autowired private RequestRepository requestRepository;

    // 관리자 권한 확인
    private boolean isAdmin(String accessToken) {
        return authChecker.hasRole(accessToken, 3) || authChecker.hasRole(accessToken, 4);
    }

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

        GuardianEntity guardian = guardianRepository.findByUserEntity_UserNo(userNo).orElse(null);
        if (guardian == null) return null;

        return guardian.getGuardianNo();
    }

    // 근무기록이 로그인한 요양보호사의 것인지 확인
    private boolean isMyReport(String accessToken, Integer reportNo) {
        Integer myCareworkerNo = getMyCareworkerNo(accessToken);
        if (myCareworkerNo == null || reportNo == null) return false;

        CareworkerReportEntity report = careWorkerReportRepository.findById(reportNo).orElse(null);
        if (report == null || report.getCareworkerEntity() == null) return false;

        return myCareworkerNo.equals(report.getCareworkerEntity().getCareworkerNo());
    }

    // [1] 근무기록 추가 - 관리자
    @PostMapping("")
    public boolean saveReport(@RequestBody CareworkerReportDto dto,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (!isAdmin(accessToken) || dto == null) return false;
        if (dto.getCareworkerNo() == null || dto.getRequestNo() == null) return false;

        return careWorkerReportService.saveReport(dto);
    }

    // [2] 센터별 근무기록 조회 - 관리자 / 보호자 본인 관련 기록
    @GetMapping("/center")
    @Transactional(readOnly = true)
    public List<CareworkerReportDto> findAllByCenter(@RequestParam Integer centerNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (centerNo == null) return new ArrayList<>();

        List<CareworkerReportDto> reports = careWorkerReportService.findAllByCenter(centerNo);
        if (isAdmin(accessToken)) return reports;

        Integer guardianNo = getMyGuardianNo(accessToken);
        if (guardianNo == null) return new ArrayList<>();

        List<CareworkerReportDto> result = new ArrayList<>();

        for (CareworkerReportDto dto : reports) {
            if (dto.getRequestNo() == null) continue;

            RequestEntity request = requestRepository.findById(dto.getRequestNo()).orElse(null);
            if (request == null || request.getCarerecipientEntity() == null) continue;

            CareRecipientEntity recipient = request.getCarerecipientEntity();
            if (recipient.getGuardianEntity() == null) continue;

            if (guardianNo.equals(recipient.getGuardianEntity().getGuardianNo())) {
                result.add(dto);
            }
        }
        return result;
    }

    // [3] 요양보호사별 근무기록 조회
    @GetMapping("/careworker")
    @Transactional(readOnly = true)
    public List<CareworkerReportDto> findAllByCareworker(@RequestParam Integer careworkerNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (careworkerNo == null) return new ArrayList<>();
        if (isAdmin(accessToken)) return careWorkerReportService.findAllByCareworker(careworkerNo);

        Integer myCareworkerNo = getMyCareworkerNo(accessToken);
        if (!careworkerNo.equals(myCareworkerNo)) return new ArrayList<>();

        return careWorkerReportService.findAllByCareworker(careworkerNo);
    }

    // [4] 근무 상태 변경 - 관리자
    @PutMapping("")
    public boolean updateReport(@RequestParam Integer careworkersReportNo,
            @RequestParam(name = "workStatus") String status,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (!isAdmin(accessToken)) return false;
        if (careworkersReportNo == null || status == null) return false;

        return careWorkerReportService.updateReport(careworkersReportNo, status);
    }

    // [5] 근무기록 삭제 - 관리자
    @DeleteMapping("")
    public boolean deleteReport(@RequestParam Integer careworkersReportNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (!isAdmin(accessToken) || careworkersReportNo == null) return false;
        return careWorkerReportService.deleteReport(careworkersReportNo);
    }

    // [6] 배정 수락 - 해당 요양보호사
    @PutMapping("/accept")
    public boolean acceptAssignment(@RequestBody AssignmentActionDto dto,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (dto == null || !isMyReport(accessToken, dto.getCareworkersReportNo())) return false;
        return careWorkerReportService.acceptAssignment(dto);
    }

    // [7] 배정 거절 - 해당 요양보호사
    @PutMapping("/reject")
    public boolean rejectAssignment(@RequestBody AssignmentActionDto dto,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (dto == null || !isMyReport(accessToken, dto.getCareworkersReportNo())) return false;
        return careWorkerReportService.rejectAssignment(dto);
    }

    // [8] 요양보호사 배정 - 관리자
    @PostMapping("/assign")
    public boolean assignCareworker(@RequestBody AssignCareworkerDto dto,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (!isAdmin(accessToken) || dto == null) return false;
        if (dto.getRequestNo() == null || dto.getCareworkerNo() == null) return false;

        return careWorkerReportService.assignCareworker(dto);
    }

    // [9] 내 수락 대기 배정 조회
    @GetMapping("/findMyAssignments")
    public List<CareworkerReportDto> findMyAssignments(@RequestParam Integer careworkerNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        Integer myCareworkerNo = getMyCareworkerNo(accessToken);
        if (myCareworkerNo == null || !myCareworkerNo.equals(careworkerNo)) return new ArrayList<>();

        return careWorkerReportService.findMyAssignments(myCareworkerNo);
    }

    // [10] 상위 3명 추천 - 관리자
    @GetMapping("/candidates")
    public List<CareWorkerRecommendationDto> candidates(@RequestParam Integer requestNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (!isAdmin(accessToken) || requestNo == null) return new ArrayList<>();
        return autoAssignService.top3Careworkers(requestNo);
    }

    // [11] 배정 가능 요양보호사 조회 - 관리자
    @GetMapping("/available")
    public List<CareworkerDto> availableCareworker(@RequestParam Integer requestNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (!isAdmin(accessToken) || requestNo == null) return new ArrayList<>();
        return autoAssignService.filterCareworkers(requestNo);
    }

    // [12] 내 확정 근무 조회
    @GetMapping("/findMyConfirmed")
    public List<CareworkerReportDto> findMyConfirmed(@RequestParam Integer careworkerNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        Integer myCareworkerNo = getMyCareworkerNo(accessToken);
        if (myCareworkerNo == null || !myCareworkerNo.equals(careworkerNo)) return new ArrayList<>();

        return careWorkerReportService.findMyConfirmed(myCareworkerNo);
    }

    // [13] 확정 근무 취소 - 해당 요양보호사
    @PutMapping("/cancel")
    public boolean cancel(@RequestBody AssignmentActionDto dto,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (dto == null || !isMyReport(accessToken, dto.getCareworkersReportNo())) return false;
        return careWorkerReportService.cancel(dto);
    }

    // [14] 근무 완료 - 해당 요양보호사
    @PutMapping("/complete")
    public boolean complete(@RequestBody AssignmentActionDto dto,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (dto == null || !isMyReport(accessToken, dto.getCareworkersReportNo())) return false;
        return careWorkerReportService.complete(dto);
    }
}
