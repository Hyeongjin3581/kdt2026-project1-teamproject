package oncare_backend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.UserCategoryDto;
import oncare_backend.model.entity.UserCategoryEntity;
import oncare_backend.model.repository.UserCategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class UserCategoryService {
    private final UserCategoryRepository userCategoryRepository;

    public List<UserCategoryDto> findAll() {
        List<UserCategoryEntity> all = userCategoryRepository.findAll();
        return all.stream().map(userCategoryEntity -> UserCategoryDto.entityToDto(userCategoryEntity)).toList();
    }
}
