package oncare_backend.controller;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CareworkerSignupDto;
import oncare_backend.model.dto.UserDto;
import oncare_backend.service.JwtUtil;
import oncare_backend.service.RedisTokenService;
import oncare_backend.service.UserService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;

import java.time.Duration;
import java.util.List;


@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final UserService userService;
    private final JwtUtil jwtUtil;

    // 회원가입
    @PostMapping
    public boolean save(@RequestBody UserDto userDto){
        return userService.save(userDto);
    }

    // 요양보호사 가입 신청: 계정 정보와 프로필 정보를 한 번에 전달받는다.
    @PostMapping("/careworker")
    public boolean registerCareworker(@RequestBody CareworkerSignupDto signupDto) {
        return userService.registerCareworker(signupDto);
    }

    // 로그인
    private final RedisTokenService redisTokenService;
    @PostMapping("/login")
    public UserDto login(@RequestBody UserDto userDto, HttpServletResponse response){

        // 서비스에게 인증 확인
        UserDto result = userService.login(userDto);
        if (result == null) {
            return null;
        }

        // token 2개 발급하기
        String accessToken = jwtUtil.createAccessToken(result.getUserNo());
        String refreshToken = jwtUtil.createRefreshToken(result.getUserNo());

        // refreshToken만 대조용으로 쓰기 위해 redis에 저장
        redisTokenService.setRefreshToken(result.getUserNo(), refreshToken);
        
        // 로그인 성공 시 쿠키 2개 생성/발급
        ResponseCookie cookie1 = ResponseCookie.from("accessToken", accessToken)
                                                .path("/").maxAge( Duration.ofMinutes(30) )
                                                .httpOnly(true).secure(false).sameSite("Lax")
                                                .build();
        
        ResponseCookie cookie2 = ResponseCookie.from("refreshToken", refreshToken)
                                                .path("/").maxAge(Duration.ofDays(7))
                                                .httpOnly(true).secure(false).sameSite("Lax")
                                                .build(); // 7일짜리 refreshToken 쿠키 완성

        // 응답 헤더의 쿠키 2개 등록
        response.addHeader(HttpHeaders.SET_COOKIE, cookie1.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie2.toString());

        return result;
    }

    // 로그인한 내 정보 조회 + 쿠키
    @GetMapping("/me")
    public UserDto getMyInfo(@CookieValue(value = "accessToken", required = false) String token) {
        if (token == null) {
            return null;
        }
        Integer loginUserNo = jwtUtil.getUserNoFromToken(token);
        if (loginUserNo == null) {
            return null;
        }
        return userService.findById(loginUserNo);
    }
    
    // 로그아웃 + 쿠키
    @PostMapping("/logout")
    public boolean logout( @CookieValue(value = "refreshToken", required = false) String refreshToken, HttpServletResponse response ){
        // 1. refreshToken 으로 회원 번호를 조회 시도
        if (refreshToken != null) {
            Integer userId = jwtUtil.getUserNoFromToken(refreshToken);
            
            // 회원이 조회된다면 레디스 안 refreshtoken 삭제
            if (userId != null) {
                redisTokenService.deleteRefreshToken(userId);                
            }
            
        }

        // 쿠키 2개도 삭제하기
        ResponseCookie cookie1 = ResponseCookie.from("accessToken", "")
                                                .path("/")
                                                .maxAge(0)
                                                .httpOnly(true)
                                                .secure(false)
                                                .build();
        ResponseCookie cookie2 = ResponseCookie.from("refreshToken", "")
                                                .path("/")
                                                .maxAge(0)
                                                .httpOnly(true)
                                                .secure(false)
                                                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie1.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie2.toString());
        return true;
    }
    
    // access 토큰 만료될 때 Refresh 검증 후 토큰 재발급
    @PostMapping("/reissue")
    public UserDto reissue( @CookieValue(value = "refreshToken", required = false) String refreshToken, HttpServletResponse response ) {
        
        // 1. refresh 토큰 가져온다. // 존재 여부 확인
        if (refreshToken == null) return null;

        // 2. refresh 토큰내 검증하여 회원번호 조회
        Integer mno = jwtUtil.getUserNoFromToken(refreshToken);
        if (mno == null) return null;

        // 3. 레디스에 저장된 refresh 토큰 꺼내기
        String savedRefreshToken = redisTokenService.getRefreshToken(mno);

        // 4. 만약에 레디스에 없거나 전달받은 토큰과 다르면 / 문제발생!
        if (savedRefreshToken == null || !refreshToken.equals(savedRefreshToken)) {
            redisTokenService.deleteRefreshToken(mno); // 다르면 토큰 삭제하여 자동 로그아웃
            return null;
        }

        // 5. 새로운 accessToken 가 RefreshToken 재발급 ( 기존 토큰들은 무효화 )
        String newAccessToken = jwtUtil.createAccessToken(mno);
        String newRefreshToken = jwtUtil.createRefreshToken(mno);

        // 6. 레디스에 새로운 refresh 토큰 저장
        redisTokenService.setRefreshToken(mno, newRefreshToken);

        // 7. 쿠키 설정
        ResponseCookie cookie1 = ResponseCookie.from("accessToken", newAccessToken)
                .path("/").maxAge(Duration.ofMinutes(30)) // 30분
                .httpOnly(true).secure(false).sameSite("Lax").build();
        ResponseCookie cookie2 = ResponseCookie.from("refreshToken", newRefreshToken)
                .path("/").maxAge(Duration.ofDays(7)) // 7일
                .httpOnly(true).secure(false).sameSite("Lax").build();

        // 8. header 에 2개 이상 쿠키 포함한경우 .addHeader( ) [ o ] .setHeader( ) [x]
        response.addHeader(HttpHeaders.SET_COOKIE, cookie1.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie2.toString());
        
        // 9. 토큰 재발급 회원정보 반환
        return userService.findById(mno);
    }
    
    // 유저전체조회
    @GetMapping
    public List<UserDto> findAll(){
        return userService.findAll();
    }

    // 유저개별조회
    @GetMapping(params = "no")
    public UserDto findById(@RequestParam Integer no){
        return userService.findById(no);
    }

    // 유저탈퇴
    @DeleteMapping
    public boolean delete(@RequestParam Integer no){
        return userService.delete(no);
    }

    // 유저수정
    @PutMapping
    public boolean update(@RequestBody UserDto userDto){
        return userService.update(userDto);
    }

}
