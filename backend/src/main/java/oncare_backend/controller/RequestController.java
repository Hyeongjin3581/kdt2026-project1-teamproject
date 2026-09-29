package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.RequestDto;
import oncare_backend.service.RequestService;

@RestController 
@RequestMapping ("/request")
public class RequestController {

    @Autowired private RequestService requestService;
    
    // [1] 서비스요청 추가
    @PostMapping ("")
    public boolean saveRequest(@RequestBody RequestDto requestDto, 
                                @RequestParam(name="carerecipient_no")Integer carerecipientNo){
        return requestService.saveRequest(requestDto, carerecipientNo);
    }
    
    // [2] 수급자 별 서비스요청 출력
    @GetMapping("/carerecipient")
    public List<RequestDto> findAllByCareRecipients(@RequestParam(name = "carerecipient_no") Integer careRecipientNo){
        return requestService.findAllByCareRecipients(careRecipientNo);
    }
    @GetMapping ("/guardian")
    // [3] 보호자 별 서비스요청 출력
    public List<RequestDto> findAllByGuardians(@RequestParam(name = "guardian_no") Integer guardianNo){
        return requestService.findAllByGuardians(guardianNo);
    }
    // [4] 서비스 요청사항 수정
    @PutMapping ("")
    public boolean updateRequest(@RequestBody RequestDto requestDto,
                                @RequestParam (name = "request_no")Integer requestNo){
        return requestService.updateRequest(requestNo, requestDto);
    }
    // [5] 서비스 요청 삭제
    @DeleteMapping ("")
    public boolean deleteRequest(@RequestParam (name = "request_no")Integer requestNo){
        return requestService.deleteRequest(requestNo);
    }
}
