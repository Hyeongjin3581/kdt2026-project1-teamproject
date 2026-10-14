package oncare_backend.controller;

import java.util.List;

import oncare_backend.service.AuthChecker;
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


    // 1. 요양보호사 등록 --> 관리자(4) (요양보호사는 회원가입으로 들어오므로 화면에서는 사용하지 않음)
    @PostMapping("")
    public boolean createCareworker(
            @CookieValue(value = "accessToken", required = false) String token,
            @RequestBody CareworkerDto careworkerDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }

        return careworkersService.createCareworker(careworkerDto);
    }


    // 2. 요양보호사 전체조회
    // 요양보호사 로그인 화면이 로그인 전에 '가입 승인 대기' 여부를 확인할 때도 사용하므로 토큰 검사를 하지 않는다
    @GetMapping("")
    public List<CareworkerDto> CareworkersFindAll(
        @CookieValue(value = "accessToken",required = false) String accessToken) {

            if (accessToken == null ) return List.of();
            Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
            if (loginUserNo == null ) return List.of();
        return careworkersService.getCareworkers();
    }


    // 3. 요양보호사 상세조회 --> 관리자, 요양보호사가 사용하므로 로그인만 확인
    // /api/careworkers/detail?careworkerNo=1
    @GetMapping("/detail")
    @Transactional(readOnly = true)
    public CareworkerDto getCareworker(
            @CookieValue(value = "accessToken", required = false) String token,
            @RequestParam(name = "careworkerNo")
            Integer careworkerNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return null;
        }

        return careworkersService.getCareworker(careworkerNo);
    }

    // 시스템 관리자 Access 토큰으로 가입 승인 대기 목록 조회
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


    // 4. 요양보호사 수정 --> 관리자(4)의 수정 창 + 요양보호사(2)의 내 정보 수정
    @PutMapping("")
    public boolean updateCareworker(
            @CookieValue(value = "accessToken", required = false) String token,
            @RequestBody CareworkerDto careworkerDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4) && !authChecker.hasRole(token,2)){
            return false;
        }

        return careworkersService.updateCareworker(careworkerDto);
    }


    // 5. 요양보호사 삭제 --> 관리자(4)
    // /api/careworkers?careworkerNo=1
    @DeleteMapping("")
    public boolean deleteCareworker(
            @CookieValue(value = "accessToken", required = false) String token,
            @RequestParam(name = "careworkerNo")
            Integer careworkerNo) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }

        return careworkersService.deleteCareworker(careworkerNo);
    }
}
