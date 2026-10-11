package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.CareworkerReviewDto;
import oncare_backend.service.CareworkerReviewService;

@RestController 
@RequestMapping("/api/review")
public class CareworkerReviewController {

    @Autowired private CareworkerReviewService careworkerReviewService;

    @PostMapping("")
    public boolean createReview(@RequestBody CareworkerReviewDto reviewDto){
        return careworkerReviewService.createReview(reviewDto);
    }

    @GetMapping("")
    public List<CareworkerReviewDto> getReviews(@RequestParam(name = "careworkerNo") Integer careworkerNo){
        return careworkerReviewService.getReviewsByCareworker(careworkerNo);
    }

    @GetMapping("detail")
    public CareworkerReviewDto getReview(@RequestParam (name = "careworkersReportNo") Integer careworkersReportNo){
        return careworkerReviewService.getReviewByReport(careworkersReportNo);
    }
}
