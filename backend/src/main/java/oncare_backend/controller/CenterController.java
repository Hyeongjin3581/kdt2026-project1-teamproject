package oncare_backend.controller;

import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CenterDto;
import oncare_backend.service.AuthChecker;
import oncare_backend.service.CenterService;
import oncare_backend.service.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/center")
public class CenterController {
    private final CenterService centerService;

    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private AuthChecker authChecker;
    

    @PostMapping
    public boolean save(@RequestBody CenterDto centerDto){
        return centerService.save(centerDto);
    }

    @GetMapping
    public List<CenterDto> findAll(){
        return centerService.findAll();
    }

    @GetMapping(params = "no")
    public CenterDto findById(@RequestParam Integer no){
        return centerService.findById(no);
    }

    @DeleteMapping
    public boolean delete(@RequestParam Integer no){
        return centerService.delete(no);
    }

    @PutMapping
    public boolean update(@RequestBody CenterDto centerDto){
        return centerService.update(centerDto);
    }
}
