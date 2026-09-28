package oncare_backend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.UserDto;
import oncare_backend.model.entity.UserEntity;
import oncare_backend.model.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(); // 단방향 해시함수 라이브러리

    // 회원가입
    public boolean save(UserDto userDto) {
        UserEntity userEntity = userDto.dtoToEntity();
        userEntity.setUserPassword(passwordEncoder.encode(userDto.getUserPassword()));

        UserEntity saved = userRepository.save(userEntity);
        if (saved.getUserNo() >= 1){
            return true;
        }
        return false;
    }

    // 회원전체조회
    public List<UserDto> findAll() {
        List<UserEntity> all = userRepository.findAll();
        return all.stream().map(userEntity -> UserDto.entityToDto(userEntity)).toList();
    }

    // 회원개별조회
    public UserDto findById(int no) {
        UserEntity userEntity = userRepository.findById(no).orElse(null);
        if (userEntity == null){
            return null;
        }
        return UserDto.entityToDto(userEntity);
    }

    // 회원삭제
    public boolean delete(Integer no) {
        UserEntity userEntity = userRepository.findById(no).orElse(null);
        if (userEntity == null){
            return false;
        }
        userRepository.deleteById(no);
        return true;
    }

    // 회원수정
    public boolean update(UserDto userDto) {
        UserEntity setEntity = userDto.dtoToEntity();
        UserEntity userEntity = userRepository.findById(userDto.getUserNo()).orElse(null);
        if (userEntity == null){
            return false;
        }

        userEntity.setUserId(setEntity.getUserId());
        userEntity.setEmail(setEntity.getEmail());
        userEntity.setPhoneNumber(setEntity.getPhoneNumber());
        // 비밀번호가 null 이거나 비어있으면 false , 사용자가 비밀번호 입력한 경우 암호화해서 set사용해서 변경
        if (userDto.getUserPassword() != null && !userDto.getUserPassword().isBlank()){
            userEntity.setUserPassword(passwordEncoder.encode(setEntity.getUserPassword()));
        }
        return true;
    }
}
