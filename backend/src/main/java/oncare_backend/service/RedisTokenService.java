package oncare_backend.service;

import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor 
public class RedisTokenService {
    // 레디스 조작 객체 주입
    private final StringRedisTemplate stringRedisTemplate;

    // refresh 토큰 레디스 저장 함수
    public void setRefreshToken(Integer userId, String token){
        stringRedisTemplate.opsForValue().set("RT:"+userId, token, Duration.ofDays(7));
    }

    // refresh 토큰 조회 함수
    public String getRefreshToken( Integer userId ){
        return stringRedisTemplate.opsForValue().get("RT:"+userId); // 조회할 key 조합하여 조회
    }

    // refresh 토큰 삭제 함수
    public boolean deleteRefreshToken( Integer userId ){
        return stringRedisTemplate.delete("RT:"+userId);
    }
    
}