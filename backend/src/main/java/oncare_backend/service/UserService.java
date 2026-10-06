package oncare_backend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.UserDto;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.entity.UserCategoryEntity;
import oncare_backend.model.entity.UserEntity;
import oncare_backend.model.repository.GuardianRepository;
import oncare_backend.model.repository.UserCategoryRepository;
import oncare_backend.model.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final UserCategoryRepository userCategoryRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(); // 단방향 해시함수 라이브러리
    private final GuardianRepository guardianRepository;
    // 회원가입
    public boolean save(UserDto userDto) {
        if (userDto.getUserCategoryNo() == null) return false;

        UserEntity userEntity = userDto.dtoToEntity();
        userEntity.setUserPassword(passwordEncoder.encode(userDto.getUserPassword())); // 유저 password 암호화 해서 세팅

        // 넘긴 유저카테고리no값으로 해당 카테고리 찾아서 userEntity에 대입
        UserCategoryEntity userCategoryEntity = userCategoryRepository.findById(userDto.getUserCategoryNo()).orElse(null);
        if (userCategoryEntity == null){
            return false;
        }
        userEntity.setUserCategoryEntity(userCategoryEntity);
        UserEntity saved = userRepository.save(userEntity);
        if (userDto.getUserCategoryNo() == 1) {
            GuardianEntity guardian = GuardianEntity.builder()
                    .userEntity(saved)
                    .guardianName(userDto.getGuardianName())
                    .guardianRelationship(userDto.getGuardianRelationship())
                    .build();
            guardianRepository.save(guardian);
        }

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

        UserCategoryEntity userCategoryEntity = null;
        if (userDto.getUserCategoryNo() != null) {
            userCategoryEntity = userCategoryRepository.findById(userDto.getUserCategoryNo()).orElse(null);
            if (userCategoryEntity == null) return false;
        }

        userEntity.setUserId(setEntity.getUserId());
        userEntity.setEmail(setEntity.getEmail());
        userEntity.setPhoneNumber(setEntity.getPhoneNumber());
        if (userCategoryEntity != null) {
            userEntity.setUserCategoryEntity(userCategoryEntity);
        }
        // 비밀번호가 null 이거나 비어있으면 false , 사용자가 비밀번호 입력한 경우 암호화해서 set사용해서 변경
        if (userDto.getUserPassword() != null && !userDto.getUserPassword().isBlank()){
            userEntity.setUserPassword(passwordEncoder.encode(setEntity.getUserPassword()));
        }
        return true;
    }

    // 회원 로그인
    public UserDto login( UserDto userDto ){
        // 매개변수 -> ID, 비번등 입력된 DTO

        // 1. 입력받은 아이디 존재여부 확인
        UserEntity userEntity = userRepository.findByUserId(userDto.getUserId());
        if (userEntity == null) { return null; }

        // 2. 아이디 존재 시 평문 - 암호문 비교
        boolean isPasswordCorrect = passwordEncoder.matches(userDto.getUserPassword(),userEntity.getUserPassword());
        if (!isPasswordCorrect) { return null; }
        System.out.println(userDto.getUserId() + "님 로그인함");

        // 3. entity -> dto로 변환 및 반환
        return UserDto.entityToDto(userEntity);
    }
}
