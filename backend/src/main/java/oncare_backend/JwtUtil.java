package oncare_backend;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component 
public class JwtUtil {
    private final SecretKey secretKey;

    public JwtUtil(@Value("${jwt.secret}") String key ){
        this.secretKey = Keys.hmacShaKeyFor(key.getBytes(StandardCharsets.UTF_8));
    }
    // 1. jwt access token 생성
    public String createAccessToken( Long mno ){
        String jwt = Jwt.builder()
                        .claim("type","ACCESS")
                        .subject( mno+"")
                        .issuedAt( new Date())
                        .expiration( new Date( new Date().getTime()+ 1000L * 60 * 30 ))

    }
}
