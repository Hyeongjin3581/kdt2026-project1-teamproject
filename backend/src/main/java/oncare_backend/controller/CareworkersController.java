package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import oncare_backend.service.CareworkersService;
import oncare_backend.service.JwtUtil;

@RestController
@RequestMapping("/api/careworkers")
public class CareworkersController {

    @Autowired
    private CareworkersService careworkersService;

    @Autowired
    private JwtUtil jwtUtil;


    // 1. 요양보호사 등록
    @PostMapping("")
    public boolean createCareworker(
            @RequestBody CareworkerDto careworkerDto) {

        return careworkersService.createCareworker(careworkerDto);
    }


    // 2. 요양보호사 전체조회
    @GetMapping("")
    public List<CareworkerDto> getCareworkers() {

        return careworkersService.getCareworkers();
    }


    // 3. 요양보호사 상세조회
    // /api/careworkers/detail?careworkerNo=1
    @GetMapping("/detail")
    public CareworkerDto getCareworker(
            @RequestParam(name = "careworkerNo")
            Integer careworkerNo) {

        return careworkersService.getCareworker(careworkerNo);
    }

    // 시스템 관리자 Access 토큰으로 가입 승인 대기 목록 조회
    @GetMapping("/pending")
    public ResponseEntity<List<CareworkerDto>> getPendingCareworkers(
            @CookieValue(value = "accessToken", required = false) String accessToken) {
        Integer adminUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (adminUserNo == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<CareworkerDto> careworkerDtos =
                careworkersService.getPendingCareworkers(adminUserNo);
        if (careworkerDtos == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(careworkerDtos);
    }

    // 시스템 관리자 Access 토큰으로 가입 신청 승인
    @PostMapping("/approve")
    public boolean approveCareworker(
            @RequestParam(name = "careworkerNo") Integer careworkerNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {
        Integer adminUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (adminUserNo == null) return false;

        return careworkersService.approveCareworker(careworkerNo, adminUserNo);
    }


    // 4. 요양보호사 수정
    @PutMapping("")
    public boolean updateCareworker(
            @RequestBody CareworkerDto careworkerDto) {

        return careworkersService.updateCareworker(careworkerDto);
    }


    // 5. 요양보호사 삭제
    // /api/careworkers?careworkerNo=1
    @DeleteMapping("")
    public boolean deleteCareworker(
            @RequestParam(name = "careworkerNo")
            Integer careworkerNo) {

        return careworkersService.deleteCareworker(careworkerNo);
    }

}