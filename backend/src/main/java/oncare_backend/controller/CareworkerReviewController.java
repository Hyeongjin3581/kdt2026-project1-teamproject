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

    @GetMapping("/careworker")
    public List<CareworkerReviewDto> getReviewsByCareworker(@RequestParam(name = "careworkerNo") Integer careworkerNo){
        return careworkerReviewService.getReviewsByCareworker(careworkerNo);
    }

    @GetMapping("detail")
    public CareworkerReviewDto getReview(@RequestParam (name = "careworkersReportNo") Integer careworkersReportNo){
        return careworkerReviewService.getReviewByReport(careworkersReportNo);
    }

    @GetMapping("/guardian")
    public List<CareworkerReviewDto> getReviewsByGuardian(@RequestParam(name = "guardianNo" ) Integer guardianNo){
        return careworkerReviewService.getReviewsByCareworker(guardianNo);
    }

    @PutMapping("")
    public boolean updateReview(@RequestBody CareworkerReviewDto reviewDto){
        return careworkerReviewService.updateReview(reviewDto);
    }

    @DeleteMapping("")
    public boolean deleteReview(@RequestBody CareworkerReviewDto reviewDto){
        return careworkerReviewService.deleteReview(reviewDto);
    }
}
