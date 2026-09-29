package oncare_backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import oncare_backend.model.dto.CaregiverAvailabilityDto;
import oncare_backend.model.entity.CaregiverAvailabilityEntity;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.repository.CaregiverAvailabilityRepository;
import oncare_backend.model.repository.CareworkersRepository;

@Service 
public class CaregiverAvailabilityService {
    @Autowired 
    private CaregiverAvailabilityRepository caregiverAvailabilityRepository;

    @Autowired 
    private CareworkersRepository careworkersRepository;

    // 1. 근무가능시간 등록
    public boolean createCaregiverAvailability(CaregiverAvailabilityDto caregiverAvailabilityDto){
        if (caregiverAvailabilityDto.getCaregiverNo() == null) return false;

        // 1. DTO -> Entity
        CaregiverAvailabilityEntity caregiverAvailabilityEntity = caregiverAvailabilityDto.dtoToEntity();

        // 2. 요양보호사 번호로 요양보호사찾기
        CareworkerEntity careworkerEntity = careworkersRepository.findById(caregiverAvailabilityDto.getCaregiverNo()).orElse(null);

        // 3. 요양보호사가 없으면 등록 실패
        if ( careworkerEntity == null ) return false;

        // 4. FK 연결
        caregiverAvailabilityEntity.setCareworkerEntity(careworkerEntity);

        // 5. DB 저장
        CaregiverAvailabilityEntity savedEntity = caregiverAvailabilityRepository.save(caregiverAvailabilityEntity);

        // 6. PK 생성여부
        if ( savedEntity.getAvailabilityNo() >= 1 ) return true;

        return false;
    }

    // 2. 근무가능시간 전체조회
    public List<CaregiverAvailabilityDto> getCaregiverAvailabilities() {
        List<CaregiverAvailabilityEntity> caregiverAvailabilityEntities = caregiverAvailabilityRepository.findAll();
        List<CaregiverAvailabilityDto> caregiverAvailabilityDtos = new ArrayList<>();

        caregiverAvailabilityEntities.forEach(caregiverAvailabilityEntity -> {
            CaregiverAvailabilityDto caregiverAvailabilityDto = CaregiverAvailabilityDto.entityToDto(caregiverAvailabilityEntity);
            caregiverAvailabilityDtos.add(caregiverAvailabilityDto);
        });

        return caregiverAvailabilityDtos;
    }

    // 3. 근무가능시간 상세조회
    public CaregiverAvailabilityDto getCaregiverAvailability(Integer availabilityNo) {
        CaregiverAvailabilityEntity caregiverAvailabilityEntity = caregiverAvailabilityRepository.findById(availabilityNo).orElse(null);

        if ( caregiverAvailabilityEntity == null ) return null;

        return CaregiverAvailabilityDto.entityToDto(caregiverAvailabilityEntity);
    }

    // 4. 근무가능시간 수정
    public boolean updateCaregiverAvailability(CaregiverAvailabilityDto caregiverAvailabilityDto) {
        CaregiverAvailabilityEntity caregiverAvailabilityEntity = caregiverAvailabilityRepository.findById(caregiverAvailabilityDto.getAvailabilityNo()).orElse(null);

        if ( caregiverAvailabilityEntity == null ) return false;
        if (caregiverAvailabilityDto.getCaregiverNo() == null) return false;

        CareworkerEntity careworkerEntity = careworkersRepository.findById(caregiverAvailabilityDto.getCaregiverNo()).orElse(null);

        if ( careworkerEntity == null ) return false;

        caregiverAvailabilityEntity.setAvailableDate(caregiverAvailabilityDto.getAvailableDate());
        caregiverAvailabilityEntity.setStartTime(caregiverAvailabilityDto.getStartTime());
        caregiverAvailabilityEntity.setEndTime(caregiverAvailabilityDto.getEndTime());
        caregiverAvailabilityEntity.setStatus(caregiverAvailabilityDto.getStatus());

        caregiverAvailabilityEntity.setCareworkerEntity(careworkerEntity);

        caregiverAvailabilityRepository.save(caregiverAvailabilityEntity);

        return true;
    }

    // 5. 근무가능시간 삭제
    public boolean deleteCaregiverAvailability(Integer availabilityNo) {
        CaregiverAvailabilityEntity caregiverAvailabilityEntity = caregiverAvailabilityRepository.findById(availabilityNo).orElse(null);

        if ( caregiverAvailabilityEntity == null ) return false;

        caregiverAvailabilityRepository.deleteById(availabilityNo);

        return true;
    }
}