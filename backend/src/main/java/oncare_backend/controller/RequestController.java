package oncare_backend.controller;

import java.util.List;

import oncare_backend.model.dto.NotifyType;
import oncare_backend.service.AuthChecker;
import oncare_backend.service.JwtUtil;
import oncare_backend.service.NotifyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import oncare_backend.model.dto.RequestDto;
import oncare_backend.service.RequestService;

@RestController 
@RequestMapping ("/request")
public class RequestController {

    @Autowired private RequestService requestService;
    @Autowired private NotifyService notifyService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private AuthChecker authChecker;
    
    // [1] 서비스요청 추가
    @PostMapping ("")
    public boolean saveRequest(@CookieValue(value = "accessToken", required = false)String token,
                                @RequestBody RequestDto requestDto,
                                @RequestParam(name="careRecipientNo")Integer carerecipientNo){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,1)){
            return false;
        }

        boolean result = requestService.saveRequest(requestDto, carerecipientNo);
        if (result){
            notifyService.toAdmin(NotifyType.NEW_REQUEST, "새 서비스 신청이 들어왔습니다.");
        }
        return result;
    }
    
    // [2] 수급자 별 서비스요청 출력
    @GetMapping("/carerecipient")
    public List<RequestDto> findAllByCareRecipients(@CookieValue(value = "accessToken", required = false)String token,
                                                    @RequestParam(name = "careRecipientNo") Integer careRecipientNo){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        return requestService.findAllByCareRecipients(careRecipientNo);
    }

    // [3] 보호자 별 서비스요청 출력
    @GetMapping ("/guardian")
    public List<RequestDto> findAllByGuardians(@CookieValue(value = "accessToken", required = false)String token,
                                               @RequestParam(name = "guardianNo") Integer guardianNo){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return List.of();
        }
        return requestService.findAllByGuardians(guardianNo);
    }

    // [4] 서비스 요청사항 수정
    @PutMapping ("")
    public boolean updateRequest(@CookieValue(value = "accessToken", required = false)String token,
                                 @RequestBody RequestDto requestDto,
                                 @RequestParam (name = "requestNo")Integer requestNo){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        return requestService.updateRequest(requestNo, requestDto);
    }
    // [5] 서비스 요청 삭제 --> 보호자(1) : 보호자 화면의 신청 취소
    @DeleteMapping ("")
    public boolean deleteRequest(@CookieValue(value = "accessToken", required = false)String token,
                                 @RequestParam (name = "requestNo")Integer requestNo){
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,1)){
            return false;
        }
        return requestService.deleteRequest(requestNo);
    }
}
