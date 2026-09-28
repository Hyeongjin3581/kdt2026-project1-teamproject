package oncare_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import oncare_backend.model.dto.InquiryCategoryDto;
import oncare_backend.service.InquiryCategoryService;

@RestController 
@RequestMapping("/api/문의카테고리")
public class InquiryCategoryController {

	@Autowired
	private InquiryCategoryService inquiryCategoryService;

	// 1. 문의 카테고리 전체 조회
	@GetMapping
	public List<InquiryCategoryDto> 문의카테고리전체조회() {
		return inquiryCategoryService.문의카테고리전체조회();
	}
}

// 고정된 데이터를 조회하는것이므로, 전체조회를 사용. 