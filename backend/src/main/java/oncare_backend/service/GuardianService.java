package oncare_backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import oncare_backend.model.dto.GuardianDto;
import oncare_backend.model.repository.GuardianRepository;

@Service 
public class GuardianService {

	@Autowired
	private GuardianRepository guardianRepository;

	// 1. 보호자 전체 조회(관리자)
	@Transactional(readOnly = true)
	public List<GuardianDto> GuardianFindAll() {
		return guardianRepository.findAll().stream()
				.map(GuardianDto::entityToDto)
				.toList();
	}
}
