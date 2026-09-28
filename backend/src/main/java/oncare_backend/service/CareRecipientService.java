package oncare_backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import oncare_backend.model.dto.CareRecipientDto;
import oncare_backend.model.entity.CareRecipientEntity;
import oncare_backend.model.repository.CareRecipientRepository;
@Service 
public class CareRecipientService {

	@Autowired
	private CareRecipientRepository careRecipientRepository;

	// 1. 수급자 등록
	public boolean 수급자등록(CareRecipientDto careRecipientDto) {
		CareRecipientEntity careRecipientEntity = careRecipientDto.dtoToEntity();
		CareRecipientEntity savedEntity = careRecipientRepository.save(careRecipientEntity);
		if (savedEntity.getCarerecipient_no() >= 1) { return true; }
		return false;
	}

	// 2. 수급자 전체 조회
	@Transactional(readOnly = true)
	public List<CareRecipientDto> 수급자전체조회() {
		return careRecipientRepository.findAll().stream()
				.map(CareRecipientDto::entityToDto)
				.toList();
	}

	// 3. 수급자 상세 조회
	@Transactional(readOnly = true)
	public CareRecipientDto 수급자조회(Integer careRecipientNo) {
		Optional<CareRecipientEntity> optional = careRecipientRepository.findById(careRecipientNo);
		if (optional.isPresent()) {
			return CareRecipientDto.entityToDto(optional.get());
		}
		return null;
	}

	// 4. 수급자 정보 수정
	@Transactional
	public boolean 수급자수정(Integer careRecipientNo, CareRecipientDto careRecipientDto) {
		Optional<CareRecipientEntity> optional = careRecipientRepository.findById(careRecipientNo);
		if (optional.isPresent()) {
			CareRecipientEntity careRecipientEntity = optional.get();
			careRecipientEntity.setGuardian_no(careRecipientDto.getGuardian_no());
			careRecipientEntity.setCarerecipient_name(careRecipientDto.getCarerecipient_name());
			careRecipientEntity.setCarerecipient_age(careRecipientDto.getCarerecipient_age());
			careRecipientEntity.setCarerecipient_address(careRecipientDto.getCarerecipient_address());
			careRecipientEntity.setCarerecipient_gender(careRecipientDto.getCarerecipient_gender());
			careRecipientEntity.setCareRecipient_content(careRecipientDto.getCareRecipient_content());
			careRecipientRepository.save(careRecipientEntity);
			return true;
		}
		return false;
	}

	// 5. 수급자 삭제
	@Transactional
	public boolean 수급자삭제(Integer careRecipientNo) {
		Optional<CareRecipientEntity> optional = careRecipientRepository.findById(careRecipientNo);
		if (optional.isPresent()) {
			careRecipientRepository.delete(optional.get());
			return true;
		}
		return false;
	}
}
