package oncare_backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import oncare_backend.model.dto.CareRecipientDto;
import oncare_backend.model.entity.CareRecipientEntity;
import oncare_backend.model.repository.CareRecipientRepository;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.repository.GuardianRepository;
@Service 
public class CareRecipientService {

	@Autowired
	private CareRecipientRepository careRecipientRepository;

	@Autowired
	private GuardianRepository guardianRepository;

    @Autowired
    private GeoCodingService geoCodingService;

	// 1. 수급자 등록
	public boolean CareRecipientSave(CareRecipientDto careRecipientDto) {
		GuardianEntity guardianEntity = null;
		if (careRecipientDto.getGuardianNo() != null) {
			Optional<GuardianEntity> guardianOptional = guardianRepository.findById(careRecipientDto.getGuardianNo());
			if (guardianOptional.isEmpty()) { return false; }
			guardianEntity = guardianOptional.get();
		}

		CareRecipientEntity careRecipientEntity = careRecipientDto.dtoToEntity();
		careRecipientEntity.setGuardianEntity(guardianEntity);

        List<Double> geoCoding = geoCodingService.getGeoCoding(careRecipientDto.getCareRecipientAddress());
        if (geoCoding != null) {
            careRecipientEntity.setLatitude(geoCoding.get(0));
            careRecipientEntity.setLongitude(geoCoding.get(1));
        }

        CareRecipientEntity savedEntity = careRecipientRepository.save(careRecipientEntity);
		if (savedEntity.getCareRecipientNo() >= 1) { return true; }
		return false;
	}

	// 2. 수급자 전체 조회
	@Transactional(readOnly = true)
	public List<CareRecipientDto> CareRecipientFindAll() {
		return careRecipientRepository.findAll().stream()
				.map(CareRecipientDto::entityToDto)
				.toList();
	}

	// 3. 수급자 상세 조회
	@Transactional(readOnly = true)
	public CareRecipientDto CareRecipientinquiry(Integer careRecipientNo) {
		Optional<CareRecipientEntity> optional = careRecipientRepository.findById(careRecipientNo);
		if (optional.isPresent()) {
			return CareRecipientDto.entityToDto(optional.get());
		}
		return null;
	}

	// 4. 수급자 정보 수정
	@Transactional
	public boolean CareRecipientModify(CareRecipientDto careRecipientDto) {
		Optional<CareRecipientEntity> optional = careRecipientRepository
				.findById(careRecipientDto.getCareRecipientNo());
		if (optional.isPresent()) {
			GuardianEntity guardianEntity = null;
			if (careRecipientDto.getGuardianNo() != null) {
				Optional<GuardianEntity> guardianOptional = guardianRepository.findById(careRecipientDto.getGuardianNo());
				if (guardianOptional.isEmpty()) { return false; }
				guardianEntity = guardianOptional.get();
			}

			CareRecipientEntity careRecipientEntity = optional.get();
			careRecipientEntity.setGuardianEntity(guardianEntity);
			careRecipientEntity.setCareRecipientName(careRecipientDto.getCareRecipientName());
			careRecipientEntity.setCareRecipientAge(careRecipientDto.getCareRecipientAge());
            // 수정된 careRecipientDto 주소가 저장된 주소랑 다르면 위도, 경도 다시 변경
            if (!careRecipientDto.getCareRecipientAddress().equals(careRecipientEntity.getCareRecipientAddress())){
                List<Double> geoCoding = geoCodingService.getGeoCoding(careRecipientDto.getCareRecipientAddress());
                if (geoCoding != null){
                    careRecipientEntity.setLatitude(geoCoding.get(0));
                    careRecipientEntity.setLongitude(geoCoding.get(1));
                }
            }
			careRecipientEntity.setCareRecipientAddress(careRecipientDto.getCareRecipientAddress());
			careRecipientEntity.setCareRecipientGender(careRecipientDto.getCareRecipientGender());
			careRecipientEntity.setCareRecipientContent(careRecipientDto.getCareRecipientContent());
			careRecipientRepository.save(careRecipientEntity);
			return true;
		}
		return false;
	}

	// 5. 수급자 삭제
	@Transactional
	public boolean CareRecipientDelete(CareRecipientDto careRecipientDto) {
		Optional<CareRecipientEntity> optional = careRecipientRepository
				.findById(careRecipientDto.getCareRecipientNo());
		if (optional.isPresent()) {
			careRecipientRepository.delete(optional.get());
			return true;
		}
		return false;
	}
}
