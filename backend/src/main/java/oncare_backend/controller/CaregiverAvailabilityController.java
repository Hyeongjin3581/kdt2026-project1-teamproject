package oncare_backend.controller;

import java.util.List;

import oncare_backend.service.AuthChecker;
import oncare_backend.service.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.CaregiverAvailabilityDto;
import oncare_backend.service.CaregiverAvailabilityService;


// 근무가능시간은 요양보호사(2) 화면에서만 사용한다
@RestController
@RequestMapping("/api/caregiver-availability")
public class CaregiverAvailabilityController {

    @Autowired
    private CaregiverAvailabilityService caregiverAvailabilityService;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private AuthChecker authChecker;


    // 1. 근무가능시간 등록
    @PostMapping("")
    public boolean createCaregiverAvailability(
            @CookieValue(value = "accessToken", required = false) String token,
            @RequestBody CaregiverAvailabilityDto caregiverAvailabilityDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,2)){
            return false;
        }

        return caregiverAvailabilityService
                .createCaregiverAvailability(caregiverAvailabilityDto);
    }


    // 2. 근무가능시간 전체조회
    @GetMapping("")
    public List<CaregiverAvailabilityDto> getCaregiverAvailabilities(
            @CookieValue(value = "accessToken", required = false) String token) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        if (!authChecker.hasRole(token,2)){
            return List.of();
        }

        return caregiverAvailabilityService
                .getCaregiverAvailabilities();
    }


    // 3. 근무가능시간 상세조회
    // /api/caregiver-availability/detail?availabilityNo=1
    @GetMapping("/detail")
    public CaregiverAvailabilityDto getCaregiverAvailability(
            @CookieValue(value = "accessToken", required = false) String token,
            @RequestParam(name = "availabilityNo")
            Integer availabilityNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return null;
        }
        if (!authChecker.hasRole(token,2)){
            return null;
        }

        return caregiverAvailabilityService
                .getCaregiverAvailability(availabilityNo);
    }


    // 4. 근무가능시간 수정
    @PutMapping("")
    public boolean updateCaregiverAvailability(
            @CookieValue(value = "accessToken", required = false) String token,
            @RequestBody CaregiverAvailabilityDto caregiverAvailabilityDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,2)){
            return false;
        }

        return caregiverAvailabilityService
                .updateCaregiverAvailability(caregiverAvailabilityDto);
    }


    // 5. 근무가능시간 삭제
    // /api/caregiver-availability?availabilityNo=1
    @DeleteMapping("")
    public boolean deleteCaregiverAvailability(
            @CookieValue(value = "accessToken", required = false) String token,
            @RequestParam(name = "availabilityNo")
            Integer availabilityNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,2)){
            return false;
        }

        return caregiverAvailabilityService
                .deleteCaregiverAvailability(availabilityNo);
    }

}
