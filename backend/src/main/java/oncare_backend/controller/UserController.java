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

    @PostMapping
    public boolean save(@RequestBody UserDto userDto){
        return userService.save(userDto);
    }

    @GetMapping
    public List<UserDto> findAll(){
        return userService.findAll();
    }

    @GetMapping(params = "no")
    public UserDto findById(@RequestParam Integer no){
        return userService.findById(no);
    }

    @DeleteMapping
    public boolean delete(@RequestParam Integer no){
        return userService.delete(no);
    }

    @PutMapping
    public boolean update(@RequestBody UserDto userDto){
        return userService.update(userDto);
    }

}
