package oncare_backend.service;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

@Component // 일반 객체(Bean) 생성
public class JwtUtil {
    @Value("${jwt.secret}") private String key;

    // sha알고리즘 + 비밀 키 조합 -> hmacSha
    private SecretKey secretKey;
    @PostConstruct 
    public void init(){
        this.secretKey = Keys.hmacShaKeyFor( key.getBytes( StandardCharsets.UTF_8 ) );
    }

    // refresh 토큰 생성 메소드
    public String createRefreshToken( Integer userId ){
        String jwt = Jwts.builder()
                    .claim("type", "REFRESH")
                    .subject(userId+"")
                    .issuedAt(new Date())
                    .expiration( new Date( new Date().getTime()+1000L * 60 * 60 * 24 * 7 ) ) // 엑세스 토큰보다는 길게 설정 (7일)
                    .signWith( secretKey )
                    .compact(); // 생성된 토큰 문자열 반환

        System.out.print("Access Token ");
        return jwt;
    }

    // Access 토큰 생성 메소드
    public String createAccessToken( Integer userId ){
        String jwt = Jwts.builder() // 토큰 생성 시작
                .claim("type", "ACCESS") //
                .subject(userId + "") // 토큰에 들어갈 내용(playload)들( 주로 식별번호, 권한 )
                .issuedAt(new Date()) // 토큰 생성 시간 ,
                .expiration(new Date(new Date().getTime() + 1000L * 60 * 30)) // 토큰 만료 시간(30분)
                // new Date() 현재시간 , new Date().getTime() 현재시간초 , * 60(1분) * 60 (1시간)
                .signWith(secretKey) // 비밀키로 전자서명
                .compact(); // 토큰 생성 끝 , 토큰정보 문자열(String) 로 반환
        return jwt;
    }

    // Access 토큰만 검증하고 회원 번호 반환
    public Integer getUserNoFromAccessToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            if (!"ACCESS".equals(claims.get("type", String.class))) {
                return null;
            }

            return Integer.parseInt(claims.getSubject());
        } catch (Exception e) {
            return null;
        }
    }

    // JWT 토큰 검증 메소드
    public Integer getUserNoFromToken( String token ){
        try{  // 만약에 token 파싱(가져오기)이 실패이면 예외 발생한다.
            Claims claims = Jwts.parser() // 파싱
                            .verifyWith( secretKey ) // 전자서명 이용한 검증
                            .build()
                            .parseSignedClaims( token ) // 파싱할 토큰 
                            .getPayload(); // JWT 안에 payload 값 반환 
            Integer mno = Integer.parseInt( claims.getSubject() ) ; // payload 안에 subject 꺼내기 (문자열타입-->Integer타입 변환 )
            return mno; // 토큰 검증이 성공이면 회원번호 반환 
        }catch(Exception e ){
            return null; // 만약에 토큰이 없거나 문제가 있으면 null 반환 
        }
    }
}
