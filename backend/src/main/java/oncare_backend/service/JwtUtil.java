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

@Component // 일반 객체(빈)
public class JwtUtil {
    // properties 파일 안에 jwt.secret 만들어야 함
    @Value("${jwt.secret}")  
    private String key;

    // sha알고리즘 + 비밀 키 조합
    private SecretKey secretKey;
    @PostConstruct // 의존성 완료 후 딱 한 번 호출
    public void init(){
        this.secretKey = Keys.hmacShaKeyFor(key.getBytes(StandardCharsets.UTF_8) );
    }

    // JWT refresh 토큰 생성하는 메소드
    public String createRefreshToken( Long mno ){
        return Jwts.builder() // 토큰 생성 시작
                    .claim("type", "REFRESH") // 어떤 토큰인지 명시만 해주는 부분, 빼먹어도 지장X
                    .subject(mno+"")
                    .issuedAt(new Date())
                    .expiration(new Date(new Date().getTime() + 1000L * 60 * 60 * 24 * 30 * 7)) // 엑세스 토큰보다 만료기간 길게(7일)
                    .signWith( secretKey )
                    .compact(); // 생성된 토큰 문자열 반환
    }

    // JWT Access 토큰 생성 메소드
    public String createAccessToken( Long mno ){
        String jwt = Jwts.builder() // 토큰 생성 시작
                        .claim("type", "ACCESS") // 어떤 토큰인지 명시만 해주는 부분, 빼먹어도 지장X
                        .subject(mno+"")
                        .issuedAt(new Date())
                        .expiration(new Date(new Date().getDate()+ 1000L * 60 * 30)) // 토큰 만료 시간(30분)
                        .signWith(secretKey)
                        .compact(); // 토큰 생성 끝

        System.out.println(jwt);

        return jwt;
    }

    // JWT 토큰 검증 메소드
    public Long getMnoFromToken( String token ){
        try {
            Claims claims = Jwts.parser() // 파싱
                                .verifyWith(secretKey)
                                .build()
                                .parseSignedClaims(token)
                                .getPayload();
            Long mno = Long.parseLong( claims.getSubject() );
            System.out.println(mno);
            return mno;
        } catch (Exception e) {
            return null;
        }
    }
}
