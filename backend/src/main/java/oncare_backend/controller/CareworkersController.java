package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.CareworkerDto;
import oncare_backend.model.dto.UserDto;
import oncare_backend.service.AuthChecker;
import oncare_backend.service.CareworkersService;
import oncare_backend.service.JwtUtil;

@RestController
@RequestMapping("/api/careworkers")
public class CareworkersController {

    @Autowired
    private CareworkersService careworkersService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthChecker authChecker;


    // 1. 요양보호사 등록
    @PostMapping("")
    public boolean createCareworker(
        @RequestBody CareworkerDto careworkerDto,
        @CookieValue(value = "accessToken", required = false)String accessToken) {
            if (!authChecker.hasRole(accessToken, 4)) return false;
        return careworkersService.createCareworker(careworkerDto);
    }


    // 2. 요양보호사 전체조회
    @GetMapping("")
    public List<CareworkerDto> CareworkersFindAll(
        @CookieValue(value = "accessToken",required = false) String accessToken) {

            if (accessToken == null ) return List.of();
            Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
            if (loginUserNo == null ) return List.of();
        return careworkersService.getCareworkers();
    }


    // 3. 요양보호사 상세조회
    // /api/careworkers/detail?careworkerNo=1
    @GetMapping("/detail")
    @Transactional(readOnly = true)
    public CareworkerDto getCareworker(
            @RequestParam Integer careworkerNo,
            @CookieValue(value = "accessToken", required = false) String accessToken){
                if (careworkerNo==null) return null;
            
                List<CareworkerDto> careworkers = CareworkersFindAll(accessToken);
                for(CareworkerDto dto : careworkers){
                    if (careworkerNo.equals(dto.getCareworkerNo()))  return dto;
                }
                return null;
    }

    // 가입 승인 대기 목록 - 시스템 관리자
    @GetMapping("/pending")
    public ResponseEntity<List<CareworkerDto>> getPendingCareworkers(
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (accessToken == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (!authChecker.hasRole(accessToken, 4)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Integer adminUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (adminUserNo == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<CareworkerDto> careworkerDtos = careworkersService.getPendingCareworkers(adminUserNo);
        if (careworkerDtos == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        return ResponseEntity.ok(careworkerDtos);
    }

    // 가입 신청 승인 - 시스템 관리자
    @PostMapping("/approve")
    public boolean approveCareworker(@RequestParam(name = "careworkerNo") Integer careworkerNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (!authChecker.hasRole(accessToken, 4)) return false;
        if (careworkerNo == null) return false;

        Integer adminUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (adminUserNo == null) return false;

        return careworkersService.approveCareworker(careworkerNo, adminUserNo);
    }

    // [4] 요양보호사 수정 - 본인 또는 관리자
    @PutMapping("")
    @Transactional
    public boolean updateCareworker(@RequestBody CareworkerDto careworkerDto,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (careworkerDto == null || careworkerDto.getCareworkerNo() == null) return false;

        boolean admin = authChecker.hasRole(accessToken, 3) || authChecker.hasRole(accessToken, 4);
        boolean careworker = authChecker.hasRole(accessToken, 2);
        if (!admin && !careworker) return false;

        CareworkerDto savedDto = careworkersService.getCareworker(careworkerDto.getCareworkerNo());
        if (savedDto == null) return false;

        if (careworkerDto.getCareworkerName() == null || careworkerDto.getCareworkerName().isBlank()) return false;
        if (careworkerDto.getCareworkerAddress() == null || careworkerDto.getCareworkerAddress().isBlank()) return false;

        if (!admin) {
            Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
            if (loginUserNo == null || !loginUserNo.equals(savedDto.getUserNo())) return false;

            // 요양보호사 본인은 이름과 주소만 수정 가능
            savedDto.setCareworkerName(careworkerDto.getCareworkerName());
            savedDto.setCareworkerAddress(careworkerDto.getCareworkerAddress());

            return careworkersService.updateCareworker(savedDto);
        }

        // 관리자 수정: 기존 연결 계정은 유지
        if (careworkerDto.getCenterNo() == null) return false;
        if (careworkerDto.getCareworkerGender() == null) return false;
        if (careworkerDto.getCareworkerAge() == null || careworkerDto.getHourWage() == null) return false;

        savedDto.setCareworkerName(careworkerDto.getCareworkerName());
        savedDto.setCareworkerAddress(careworkerDto.getCareworkerAddress());
        savedDto.setCareworkerGender(careworkerDto.getCareworkerGender());
        savedDto.setCareworkerAge(careworkerDto.getCareworkerAge());
        savedDto.setHourWage(careworkerDto.getHourWage());
        savedDto.setCareworkerState(careworkerDto.getCareworkerState());
        savedDto.setCenterNo(careworkerDto.getCenterNo());

        return careworkersService.updateCareworker(savedDto);
    }

    // [5] 요양보호사 삭제 - 관리자
    @DeleteMapping("")
    public boolean deleteCareworker(@RequestParam(name = "careworkerNo") Integer careworkerNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (!authChecker.hasRole(accessToken, 3) && !authChecker.hasRole(accessToken, 4)) return false;
        if (careworkerNo == null) return false;

        return careworkersService.deleteCareworker(careworkerNo);
    }
}