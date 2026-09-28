package oncare_backend.controller;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.UserDto;
import oncare_backend.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final UserService userService;

    // 회원가입
    @PostMapping
    public boolean save(@RequestBody UserDto userDto){
        return userService.save(userDto);
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
