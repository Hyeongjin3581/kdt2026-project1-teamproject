package oncare_backend.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.val;
import oncare_backend.model.dto.UserDto;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController 
@RequestMapping ("api/redis")
@RequiredArgsConstructor 
public class RedisController {

    // 레디스 조작하는 객체 하나 만들기 (문자열 기반의 자료를 DB 말고 레디스에 CRUD)
    private final StringRedisTemplate stringRedisTemplate;

    // 레디스 직렬화( DTO -> 문자열 ) 객체
    private final ObjectMapper objectMapper = new ObjectMapper();

    // [1] Redis 저장
    @PostMapping ("/user")
    public boolean save(@RequestBody UserDto userDto) throws JsonProcessingException {

        String key = "user:"+ userDto.getUserNo(); // 얘시) member:3
        String str = objectMapper.writeValueAsString(userDto); // dto -> 문자열 변환 (직렬화)

        stringRedisTemplate.opsForValue().set(key, str); // { member:1 : { mno:1, mid:qwe } }

        return true;
    }
    // [2] Redis 전체조회
    @GetMapping("/user")
    public List<UserDto> findAll() throws JsonMappingException, JsonProcessingException {
        Set<String> keys = stringRedisTemplate.keys("user:*");

        List<UserDto> list = new ArrayList<>();
        for( String key : keys ){
            String value = stringRedisTemplate.opsForValue().get(key);

            UserDto userDto = objectMapper.readValue(value, UserDto.class);

            list.add(userDto);
        }

        return list;
    }
    
    // [3] Redis 개별조회
    @GetMapping("/user/find")
    public UserDto find(@RequestParam(name = "userNo") Integer userNo ) throws JsonMappingException, JsonProcessingException {
        String findKey = "user:"+ userNo;
        String value = stringRedisTemplate.opsForValue().get(findKey);
        if (value == null) {
            return null;
        }

        UserDto userDto = objectMapper.readValue(value, UserDto.class);

        return userDto;
    }
    
    // [4] Redis 삭제
    @DeleteMapping("/user")
    public boolean delete( @RequestParam (name="userNo") Integer userNo){
        String deleteKey = "user:"+ userNo;
        boolean result = stringRedisTemplate.delete(deleteKey);

        return result;
    }
    
    // [5] Redis 수정
    @PutMapping("/user")
    public boolean update( @RequestBody UserDto userDto){
        String updateKey = "user:" + userDto.getUserNo();
        if (updateKey == null) return false;

        try {
            String value = objectMapper.writeValueAsString(userDto); // 직렬화
            stringRedisTemplate.opsForValue().set(updateKey, value);
            return true;
        } catch (JsonProcessingException e) {
            System.out.println(e);
        }

        return false;
    }

}
