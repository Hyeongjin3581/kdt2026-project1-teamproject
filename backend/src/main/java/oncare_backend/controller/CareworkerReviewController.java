package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.CareworkerReviewDto;
import oncare_backend.service.CareworkerReviewService;
import oncare_backend.service.AuthChecker;
import oncare_backend.service.JwtUtil;

@RestController 
@RequestMapping("/api/review")
public class CareworkerReviewController {

    @Autowired private CareworkerReviewService careworkerReviewService;

    @Autowired private JwtUtil jwtUtil;

    @Autowired private AuthChecker authChecker;

    // 1. 후기 등록
    @PostMapping("")
    public boolean createReview(
        @RequestBody CareworkerReviewDto reviewDto,
        @CookieValue (value = "accessToken", required = false)String accessToken){

            if (accessToken==null)return false;
            Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
            if (loginUserNo==null) return false;
            if (!authChecker.hasRole(accessToken, 1)) return false;   // 보호자(1)만
        return careworkerReviewService.createReview(reviewDto, loginUserNo);
    }

    // 2. 요양보호사 본인 후기 조회
    @GetMapping("/careworker/my")
    public List<CareworkerReviewDto> getMyCareworkerReviews(
        @CookieValue(value = "accessToken", required = false) String accessToken){
        if (accessToken == null) return List.of();

        Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);

        if (loginUserNo == null) return List.of();
        if (!authChecker.hasRole(accessToken, 2)) return List.of();   // 요양보호사(2)만
        return careworkerReviewService.getReviewsByLoginUser(loginUserNo);
    }

    // 3. 특정 후기 조회
    @GetMapping("/detail")
    public CareworkerReviewDto getReview(
        @RequestParam (name = "careworkersReportNo") Integer careworkersReportNo,
        @CookieValue (value = "accessToken" , required = false) String accessToken
    ){
        if(accessToken==null) return null;
        Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if(loginUserNo == null) return null;
        return careworkerReviewService.getReviewByReport(careworkersReportNo, loginUserNo);
    }

    // 4. 보호자 기준 전체 조회
    @GetMapping("/guardian/my")
    public List<CareworkerReviewDto> getMyGuardianReviews(
        @CookieValue(value = "accessToken", required = false) String accessToken
    ){
        if (accessToken==null) return List.of();
        Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (loginUserNo == null) return List.of();
        if (!authChecker.hasRole(accessToken, 1)) return List.of();   // 보호자(1)만
        return careworkerReviewService.getReviewsByGuardianLoginUser(loginUserNo);
    }

    // 5. 후기 수정(보호자만)
    @PutMapping("")
    public boolean updateReview(
        @RequestBody CareworkerReviewDto reviewDto,
        @CookieValue(value = "accessToken", required = false) String accessToken
    ){
        if (accessToken==null) return false;
        Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (loginUserNo == null) return false;
        if (!authChecker.hasRole(accessToken, 1)) return false;   // 보호자(1)만
        return careworkerReviewService.updateReview(reviewDto, loginUserNo);
    }

    // 6. 후기 삭제(보호자만)
    @DeleteMapping("")
    public boolean deleteReview(
        @RequestBody CareworkerReviewDto reviewDto,
        @CookieValue(value = "accessToken", required = false) String accessToken
    ){
        if (accessToken==null) return false;
        Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (loginUserNo == null) return false;
        if (!authChecker.hasRole(accessToken, 1)) return false;   // 보호자(1)만
        return careworkerReviewService.deleteReview(reviewDto, loginUserNo);
    }
}
