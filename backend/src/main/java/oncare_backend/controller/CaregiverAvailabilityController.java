package oncare_backend.controller;

import java.util.List;

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


@RestController
@RequestMapping("/api/caregiver-availability")
public class CaregiverAvailabilityController {

    @Autowired
    private CaregiverAvailabilityService caregiverAvailabilityService;

    @Autowired
    private JwtUtil jwtUtil;

    CaregiverAvailabilityController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }


    // 1. 근무가능시간 등록
    @PostMapping("")
    public boolean createCaregiverAvailability(
        @RequestBody CaregiverAvailabilityDto caregiverAvailabilityDto,
        @CookieValue(value = "accessToken", required = false) String accessToken
) {
        if ( accessToken == null ) return false;
        Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if ( loginUserNo == null ) return false;
        return caregiverAvailabilityService
                .createCaregiverAvailability(caregiverAvailabilityDto);
    }


    // 2. 근무가능시간 전체조회
    @GetMapping("")
    public List<CaregiverAvailabilityDto> getCaregiverAvailabilities(
        @CookieValue(value = "accessToken", required = false) String accessToken){
                if (accessToken == null) return List.of();

                Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
                if (loginUserNo == null ) return List.of(); 
        
        return caregiverAvailabilityService
                .getCaregiverAvailabilities();
    }


    // 3. 근무가능시간 상세조회
    // /api/caregiver-availability/detail?availabilityNo=1
    @GetMapping("/detail")
    public CaregiverAvailabilityDto getCaregiverAvailability(
        @RequestParam(name = "availabilityNo") Integer availabilityNo,
        @CookieValue(value = "accesToken", required = false) String accessToken){
                if (accessToken == null) return null;
                Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
                if (loginUserNo == null ) return null; 
        return caregiverAvailabilityService
                .getCaregiverAvailability(availabilityNo);
    }


    // 4. 근무가능시간 수정
    @PutMapping("")
    public boolean updateCaregiverAvailability(
        @RequestBody CaregiverAvailabilityDto caregiverAvailabilityDto,
        @CookieValue(value = "accessToken", required = false)String accessToken) {
                if (accessToken==null) return false;
                Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
                if (loginUserNo==null) return false; 
        return caregiverAvailabilityService
                .updateCaregiverAvailability(caregiverAvailabilityDto);
    }


    // 5. 근무가능시간 삭제
    // /api/caregiver-availability?availabilityNo=1
    @DeleteMapping("")
    public boolean deleteCaregiverAvailability(
        @RequestParam(name = "availabilityNo") Integer availabilityNo,
        @CookieValue(value = "accessToken", required = false)String accessToken) {
                if (accessToken==null) return false;
                Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken); 
                if(loginUserNo==null) return false;
        return caregiverAvailabilityService
                .deleteCaregiverAvailability(availabilityNo);
    }

}