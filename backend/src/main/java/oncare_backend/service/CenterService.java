package oncare_backend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CenterDto;
import oncare_backend.model.entity.CenterEntity;
import oncare_backend.model.repository.CenterRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CenterService {
    private final CenterRepository centerRepository;

    public boolean save(CenterDto centerDto) {
        CenterEntity centerEntity = centerDto.dtoToEntity();
        centerRepository.save(centerEntity);
        return true;
    }

    public List<CenterDto> findAll() {
        List<CenterEntity> all = centerRepository.findAll();
        return all.stream().map(centerEntity -> CenterDto.entityToDto(centerEntity)).toList();
    }

    public CenterDto findById(Integer no) {
        CenterEntity centerEntity = centerRepository.findById(no).orElse(null);
        if (centerEntity == null){
            return null;
        }
        return CenterDto.entityToDto(centerEntity);
    }

    public boolean delete(Integer no) {
        CenterEntity centerEntity = centerRepository.findById(no).orElse(null);
        if (centerEntity == null){
            return false;
        }
        centerRepository.deleteById(no);
        return true;
    }

    public boolean update(CenterDto centerDto) {
        CenterEntity centerEntity = centerRepository.findById(centerDto.getCenterNo()).orElse(null);
        if (centerEntity == null){
            return false;
        }
        centerEntity.setCenterName(centerDto.getCenterName());
        centerEntity.setCenterAddress(centerDto.getCenterAddress());
        centerEntity.setCenterPhonenumber(centerDto.getCenterPhonenumber());
        return true;
    }
}
