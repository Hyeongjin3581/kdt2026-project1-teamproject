package oncare_backend.controller;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CenterDto;
import oncare_backend.service.AuthChecker;
import oncare_backend.service.AuthChecker;
import oncare_backend.service.CenterService;
import oncare_backend.service.JwtUtil;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/center")
public class CenterController {
    private final CenterService centerService;
    private final JwtUtil jwtUtil;
    private final AuthChecker authChecker;

    // 센터 등록 --> 관리자(4)
    @PostMapping
    public boolean save(@CookieValue(value = "accessToken", required = false)String token,
                        @RequestBody CenterDto centerDto){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }
        return centerService.save(centerDto);
    }

    // 센터 전체 조회 : 요양보호사 회원가입 화면(로그인 전)에서도 사용하므로 토큰 검사를 하지 않는다
    @GetMapping
    public List<CenterDto> findAll(){
        return centerService.findAll();
    }

    // 센터 개별 조회 : 센터 이름·주소만 있어서 토큰 검사를 하지 않는다
    @GetMapping(params = "no")
    public CenterDto findById(@RequestParam Integer no){
        return centerService.findById(no);
    }

    // 센터 삭제 --> 관리자(4)
    @DeleteMapping
    public boolean delete(@CookieValue(value = "accessToken", required = false)String token,
                          @RequestParam Integer no){
        Integer userNo = jwtUtil.getUserNoFromAccessToken(token);
        if (userNo == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }
        return centerService.delete(no);
    }

    // 센터 수정 --> 관리자(4)
    @PutMapping
    public boolean update(@CookieValue(value = "accessToken", required = false)String token,
                          @RequestBody CenterDto centerDto){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,4)){
            return false;
        }
        return centerService.update(centerDto);
    }
}
