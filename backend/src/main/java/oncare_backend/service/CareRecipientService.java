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
import oncare_backend.model.repository.RequestRepository;
@Service
public class CareRecipientService {

	@Autowired
	private CareRecipientRepository careRecipientRepository;

	@Autowired
	private GuardianRepository guardianRepository;

	@Autowired
	private RequestRepository requestRepository;

    @Autowired
    private GeoCodingService geoCodingService;

	// 1. 수급자 등록
	public boolean CareRecipientSave(CareRecipientDto careRecipientDto) {
		if (!hasRequiredValue(careRecipientDto)) { return false; }

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
				.map(this::toDto)
				.toList();
	}

	// 3. 수급자 상세 조회
	@Transactional(readOnly = true)
	public CareRecipientDto CareRecipientinquiry(Integer careRecipientNo) {
		Optional<CareRecipientEntity> optional = careRecipientRepository.findById(careRecipientNo);
		if (optional.isPresent()) {
			return toDto(optional.get());
		}
		return null;
	}

	// 필수 입력값(이름 , 나이 , 주소 , 성별) 확인 ( 비어 있으면 nullable = false 컬럼 저장 오류 500 , 주소는 지오코딩 오류 )
	private boolean hasRequiredValue(CareRecipientDto careRecipientDto) {
		if (careRecipientDto.getCareRecipientName() == null || careRecipientDto.getCareRecipientName().isBlank()) return false;
		if (careRecipientDto.getCareRecipientAge() == null) return false;
		if (careRecipientDto.getCareRecipientAddress() == null || careRecipientDto.getCareRecipientAddress().isBlank()) return false;
		if (careRecipientDto.getCareRecipientGender() == null || careRecipientDto.getCareRecipientGender().isBlank()) return false;
		return true;
	}

	private CareRecipientDto toDto(CareRecipientEntity entity) {
		GuardianEntity guardianEntity = entity.getGuardianEntity();
		return CareRecipientDto.builder()
				.careRecipientNo(entity.getCareRecipientNo())
				.guardianNo(guardianEntity == null ? null : guardianEntity.getGuardianNo())
				.careRecipientName(entity.getCareRecipientName())
				.careRecipientAge(entity.getCareRecipientAge())
				.careRecipientAddress(entity.getCareRecipientAddress())
				.careRecipientGender(entity.getCareRecipientGender())
				.careRecipientContent(entity.getCareRecipientContent())
				.createDate(entity.getCreateDate())
				.updateDate(entity.getUpdateDate())
				.build();
	}

	// 4. 수급자 정보 수정
	@Transactional
	public boolean CareRecipientModify(CareRecipientDto careRecipientDto) {
		if (careRecipientDto.getCareRecipientNo() == null) { return false; }
		if (!hasRequiredValue(careRecipientDto)) { return false; }

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
	public boolean CareRecipientDelete(Integer careRecipientNo) {
		Optional<CareRecipientEntity> careRecipientEntity = careRecipientRepository
				.findById(careRecipientNo);
		if (careRecipientEntity.isPresent()) {
			// 서비스 요청(방문 이력)이 있는 수급자는 삭제하지 않음 ( 외래키 오류 500 방지 )
			if (!requestRepository.findByCarerecipientEntity_CareRecipientNo(careRecipientNo).isEmpty()) {
				return false;
			}
			careRecipientRepository.delete(careRecipientEntity.get());
			return true;
		}
		return false;
	}
}
