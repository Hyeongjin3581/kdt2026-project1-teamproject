package oncare_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
