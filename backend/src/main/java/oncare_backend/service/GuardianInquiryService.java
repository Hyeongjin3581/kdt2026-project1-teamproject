package oncare_backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import oncare_backend.model.dto.GuardianInquiryDto;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.entity.GuardianInquiryEntity;
import oncare_backend.model.entity.InquiryCategoryEntity;
import oncare_backend.model.repository.GuardianInquiryRepository;
import oncare_backend.model.repository.GuardianRepository;
import oncare_backend.model.repository.InquiryCategoryRepository;

@Service 
public class GuardianInquiryService {

	@Autowired
	private GuardianInquiryRepository guardianInquiryRepository;

	@Autowired
	private GuardianRepository guardianRepository;

	@Autowired
	private InquiryCategoryRepository inquiryCategoryRepository;

	// 1. 보호자 문의 생성
	@Transactional
	public boolean GuardianInquiryCreate(GuardianInquiryDto guardianInquiryDto) {
		Optional<GuardianEntity> guardianOptional = guardianRepository
				.findById(guardianInquiryDto.getGuardianNo());
		Optional<InquiryCategoryEntity> categoryOptional = inquiryCategoryRepository
				.findById(guardianInquiryDto.getInquiryCategoryNo());
		if (guardianOptional.isEmpty() || categoryOptional.isEmpty()) { return false; }

		GuardianInquiryEntity guardianInquiryEntity = guardianInquiryDto.dtoToEntity();
		GuardianInquiryEntity savedEntity = guardianInquiryRepository.save(guardianInquiryEntity);
		if (savedEntity.getInquiryNo() >= 1) { return true; }
		return false;
	}

	// 2. 보호자 문의 수정
	@Transactional
	public boolean GuardianInquiryModify(GuardianInquiryDto guardianInquiryDto) {
		Optional<GuardianInquiryEntity> inquiryOptional = guardianInquiryRepository
				.findById(guardianInquiryDto.getInquiryNo());
		Optional<GuardianEntity> guardianOptional = guardianRepository
				.findById(guardianInquiryDto.getGuardianNo());
		Optional<InquiryCategoryEntity> categoryOptional = inquiryCategoryRepository
				.findById(guardianInquiryDto.getInquiryCategoryNo());
		if (inquiryOptional.isEmpty() || guardianOptional.isEmpty() || categoryOptional.isEmpty()) {
			return false;
		}

		GuardianInquiryEntity guardianInquiryEntity = inquiryOptional.get();
		guardianInquiryEntity.setGuardianNo(guardianInquiryDto.getGuardianNo());
		guardianInquiryEntity.setInquiryCategoryNo(guardianInquiryDto.getInquiryCategoryNo());
		guardianInquiryEntity.setWishDate(guardianInquiryDto.getWishDate());
		guardianInquiryEntity.setWishStartTime(guardianInquiryDto.getWishStartTime());
		guardianInquiryEntity.setWishEndTime(guardianInquiryDto.getWishEndTime());
		guardianInquiryEntity.setInquiryContent(guardianInquiryDto.getInquiryContent());
		guardianInquiryRepository.save(guardianInquiryEntity);
		return true;
	}

	// 3. 보호자 문의 삭제
	@Transactional
	public boolean GuardianInquiryDelete(GuardianInquiryDto guardianInquiryDto) {
		Optional<GuardianInquiryEntity> optional = guardianInquiryRepository
				.findById(guardianInquiryDto.getInquiryNo());
		if (optional.isPresent()) {
			guardianInquiryRepository.delete(optional.get());
			return true;
		}
		return false;
	}

	// 4. 보호자 문의 전체 조회(관리자)
	@Transactional(readOnly = true)
	public List<GuardianInquiryDto>GuardianInquiryFindAll() {
		return guardianInquiryRepository.findAll().stream()
				.map(GuardianInquiryDto::entityToDto)
				.toList();
	}
}
