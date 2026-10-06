package oncare_backend.controller;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.UserCategoryDto;
import oncare_backend.service.UserCategoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("usercategory")
public class UserCategoryController {
    private final UserCategoryService userCategoryService;

    @GetMapping
    public List<UserCategoryDto> findAll(){
        return userCategoryService.findAll();
    }
}
