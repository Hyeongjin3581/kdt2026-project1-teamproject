package oncare_backend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import oncare_backend.model.dto.CareworkerSignupDto;
import oncare_backend.model.dto.UserDto;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CenterEntity;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.entity.UserCategoryEntity;
import oncare_backend.model.entity.UserEntity;
import oncare_backend.model.repository.CareworkersRepository;
import oncare_backend.model.repository.CenterRepository;
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
    private final CareworkersRepository careworkersRepository;
    private final CenterRepository centerRepository;

    // 회원가입
    public boolean save(UserDto userDto) {
        if (userDto.getUserCategoryNo() == null || userDto.getUserCategoryNo() == 2) return false;

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

    // 요양보호사 승인대기 , 승인완료 로직구현

    // 요양보호사 User와 Careworker를 한 트랜잭션에서 가입 신청한다.
    public boolean registerCareworker(CareworkerSignupDto signupDto) {
        // 가입 요청 확인
        if (signupDto == null){
            return false;
        }
        // 필수 문자열이 null이거나 공백인지 확인
        if (signupDto.getUserId() == null || signupDto.getUserId().isBlank()) return false;
        if (signupDto.getUserPassword() == null || signupDto.getUserPassword().isBlank()) return false;
        if (signupDto.getPhoneNumber() == null || signupDto.getPhoneNumber().isBlank()) return false;
        if (signupDto.getEmail() == null || signupDto.getEmail().isBlank()) return false;
        if (signupDto.getCareworkerName() == null || signupDto.getCareworkerName().isBlank()) return false;
        if (signupDto.getCareworkerAddress() == null || signupDto.getCareworkerAddress().isBlank()) return false;
        if (signupDto.getCareworkerGender() == null || signupDto.getCareworkerGender().isBlank()) return false;
        if (signupDto.getCareworkerState() == null || signupDto.getCareworkerState().isBlank()) return false;

        // 필수 숫자값 확인
        if (signupDto.getHourWage() == null) return false;
        if (signupDto.getCareworkerAge() == null) return false;
        if (signupDto.getCenterNo() == null) return false;

        // 요양보호사 사용자 유형과 신청자가 선택한 센터 확인
        UserCategoryEntity userCategoryEntity = userCategoryRepository.findById(2).orElse(null);
        CenterEntity centerEntity = centerRepository.findById(signupDto.getCenterNo()).orElse(null);
        if (userCategoryEntity == null || centerEntity == null){
            return false;
        }

        // User 정보 생성: 비밀번호는 저장 전에 BCrypt로 암호화
        UserEntity userEntity = new UserEntity();
        userEntity.setUserId(signupDto.getUserId());
        userEntity.setUserPassword(passwordEncoder.encode(signupDto.getUserPassword()));
        userEntity.setPhoneNumber(signupDto.getPhoneNumber());
        userEntity.setEmail(signupDto.getEmail());
        userEntity.setUserCategoryEntity(userCategoryEntity);

        // User를 먼저 저장해 DB에서 생성된 user_no 확보
        UserEntity savedUserEntity = userRepository.save(userEntity);

        // 프로필 생성: 승인 상태는 요청값을 받지 않고 승인대기로 설정
        // 저장한 User와 센터를 연결해 FK 값도 함께 저장
        CareworkerEntity careworkerEntity = new CareworkerEntity();
        careworkerEntity.setCareworkerName(signupDto.getCareworkerName());
        careworkerEntity.setCareworkerAddress(signupDto.getCareworkerAddress());
        careworkerEntity.setCareworkerGender(signupDto.getCareworkerGender());
        careworkerEntity.setHourWage(signupDto.getHourWage());
        careworkerEntity.setCareworkerAge(signupDto.getCareworkerAge());
        careworkerEntity.setCareworkerState(signupDto.getCareworkerState());
        careworkerEntity.setSignState("승인대기");
        careworkerEntity.setCenterEntity(centerEntity);
        careworkerEntity.setUserEntity(savedUserEntity);

        // Careworker 저장 후 User와 Careworker의 PK 생성 여부 반환
        CareworkerEntity savedCareworkerEntity = careworkersRepository.save(careworkerEntity);
        return savedUserEntity.getUserNo() != null && savedCareworkerEntity.getCareworkerNo() != null;
    }

    // 여기까지 제작했으용

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

        // 요양보호사는 관리자가 승인한 뒤 로그인 가능
        if (Integer.valueOf(2).equals(userEntity.getUserCategoryEntity().getUserCategoryNo())) {
            CareworkerEntity careworkerEntity = careworkersRepository
                    .findByUserEntity_UserNo(userEntity.getUserNo())
                    .orElse(null);
            if (careworkerEntity == null || !"승인완료".equals(careworkerEntity.getSignState())) {
                return null;
            }
        }

        System.out.println(userDto.getUserId() + "님 로그인함");

        // 3. entity -> dto로 변환 및 반환
        return UserDto.entityToDto(userEntity);
    }
}
