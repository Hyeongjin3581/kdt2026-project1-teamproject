package oncare_backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import oncare_backend.model.dto.InquiryCategoryDto;
import oncare_backend.model.repository.InquiryCategoryRepository;

@Service 
public class InquiryCategoryService {

	@Autowired
	private InquiryCategoryRepository inquiryCategoryRepository;

	// 1. 문의 카테고리 전체 조회
	@Transactional(readOnly = true)
	public List<InquiryCategoryDto>InquiryCategoryFindAll() {
		return inquiryCategoryRepository.findAll().stream()
				.map(InquiryCategoryDto::entityToDto)
				.toList();
	}
}
