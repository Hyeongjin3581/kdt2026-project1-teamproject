package oncare_backend.service;

import java.util.ArrayList;
import java.util.List;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import oncare_backend.model.dto.CareworkerDto;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CenterEntity;
import oncare_backend.model.entity.UserEntity;
import oncare_backend.model.repository.CareworkersRepository;
import oncare_backend.model.repository.CenterRepository;
import oncare_backend.model.repository.UserRepository;

@Service
public class CareworkersService {
    @Autowired 
    private CareworkersRepository careworkerRepository;

    @Autowired
    private CenterRepository centerRepository;

    @Autowired 
    private UserRepository userRepository;

    @Autowired
    private GeoCodingService geoCodingService;

    // 1. 요양보호사 등록
    public boolean createCareworker(CareworkerDto careworkerDto) {
        if (careworkerDto.getCenterNo() == null || careworkerDto.getUserNo() == null) return false;

        // 1. DTO -> Entity
        CareworkerEntity careworkerEntity = careworkerDto.dtoToEntity();
        // 회원가입 시 승인상태는 무조건 승인대기
        careworkerEntity.setSignStatus("승인대기");

        // 2. 센터번호로 센터 찾기
        CenterEntity centerEntity = centerRepository.findById(careworkerDto.getCenterNo()).orElse(null);

        // 3. 유저번호로 유저 찾기
        UserEntity userEntity = userRepository.findById(careworkerDto.getUserNo()).orElse(null);
        
        // 4. 센터 또는 유저가 없으면 등록 실패
        if ( centerEntity == null || userEntity == null ) return false;
        
        // 5. FK 연결
        careworkerEntity.setCenterEntity(centerEntity);
        careworkerEntity.setUserEntity(userEntity);

        // 주소 -> 경도,위도 변환
        List<Double> geoCoding = geoCodingService.getGeoCoding(careworkerDto.getCareworkerAddress());
        if (geoCoding != null){
            careworkerEntity.setLatitude(geoCoding.get(0));
            careworkerEntity.setLongitude(geoCoding.get(1));
        }

        // 6. DB 저장
        CareworkerEntity savedEntity = careworkerRepository.save(careworkerEntity);

        // 7. PK 생성여부
        if ( savedEntity.getCareworkerNo() >= 1 ) return true;

        return false;
    }

    // 2. 요양보호사 전체조회
    public List<CareworkerDto> getCareworkers() {
        List<CareworkerEntity> careworkerEntities = careworkerRepository.findAll();
        List<CareworkerDto> careworkerDtos = new ArrayList<>();

        careworkerEntities.forEach(careworkerEntity -> {
            CareworkerDto careworkerDto = CareworkerDto.entityToDto(careworkerEntity);
            careworkerDtos.add(careworkerDto);
        });

        return careworkerDtos;
    }

    // 3. 요양보호사 상세조회
    public CareworkerDto getCareworker(Integer careworkerNo) {
        CareworkerEntity careworkerEntity = careworkerRepository.findById(careworkerNo).orElse(null);

        if ( careworkerEntity == null ) return null;

        return CareworkerDto.entityToDto(careworkerEntity);
    }

    // 시스템 관리자에게 승인 대기 중인 가입 신청 목록 반환
    @Transactional
    public List<CareworkerDto> getPendingCareworkers(Integer adminUserNo) {
        if (adminUserNo == null) return null;

        // 요청한 사용자가 시스템 관리자인지 확인
        UserEntity adminUserEntity = userRepository.findById(adminUserNo).orElse(null);
        if (!isSystemAdmin(adminUserEntity)) return null;

        // 승인 대기 상태인 요양보호사 신청 조회
        List<CareworkerEntity> careworkerEntities =
                careworkerRepository.findBySignState("승인대기");
        List<CareworkerDto> careworkerDtos = new ArrayList<>();

        careworkerEntities.forEach(careworkerEntity ->
                careworkerDtos.add(CareworkerDto.entityToDto(careworkerEntity)));

        return careworkerDtos;
    }

    // 시스템 관리자만 승인 대기 중인 요양보호사 가입 신청을 승인
    @Transactional
    public boolean approveCareworker(Integer careworkerNo, Integer adminUserNo) {
        if (careworkerNo == null || adminUserNo == null) return false;

        // 요청한 사용자가 시스템 관리자인지 확인
        UserEntity adminUserEntity = userRepository.findById(adminUserNo).orElse(null);
        if (!isSystemAdmin(adminUserEntity)) return false;

        // 승인 대상 요양보호사 조회
        CareworkerEntity careworkerEntity = careworkerRepository.findById(careworkerNo).orElse(null);
        if (careworkerEntity == null) return false;

        // 승인 대기 상태인 신청만 승인
        if (!"승인대기".equals(careworkerEntity.getSignState())) return false;

        careworkerEntity.setSignState("승인완료");
        CareworkerEntity savedCareworkerEntity = careworkerRepository.save(careworkerEntity);
        return "승인완료".equals(savedCareworkerEntity.getSignState());
    }

    // 사용자 유형 번호 4번인지 확인
    private boolean isSystemAdmin(UserEntity userEntity) {
        return userEntity != null
                && userEntity.getUserCategoryEntity() != null
                && Integer.valueOf(4).equals(
                        userEntity.getUserCategoryEntity().getUserCategoryNo());
    }

    // 4. 요양보호사 수정
    public boolean updateCareworker(CareworkerDto careworkerDto) {
        CareworkerEntity careworkerEntity = careworkerRepository.findById(careworkerDto.getCareworkerNo()).orElse(null);

        if ( careworkerEntity == null ) return false;
        if (careworkerDto.getCenterNo() == null || careworkerDto.getUserNo() == null) return false;

        CenterEntity centerEntity = centerRepository.findById(careworkerDto.getCenterNo()).orElse(null);
        UserEntity userEntity = userRepository.findById(careworkerDto.getUserNo()).orElse(null);

        if ( centerEntity == null || userEntity == null ) return false;

        careworkerEntity.setCareworkerName(careworkerDto.getCareworkerName());
        // 수정된 careWorkerDto의 주소가 저장된 주소랑 다르면 위도, 경도 다시 변경
        if (!careworkerDto.getCareworkerAddress().equals(careworkerEntity.getCareworkerAddress())){
            List<Double> geoCoding = geoCodingService.getGeoCoding(careworkerDto.getCareworkerAddress());
            if (geoCoding != null){
                careworkerEntity.setLatitude(geoCoding.get(0));
                careworkerEntity.setLongitude(geoCoding.get(1));
            }
        }
        careworkerEntity.setCareworkerAddress(careworkerDto.getCareworkerAddress());
        careworkerEntity.setCareworkerGender(careworkerDto.getCareworkerGender());
        careworkerEntity.setHourWage(careworkerDto.getHourWage());
        careworkerEntity.setCareworkerAge(careworkerDto.getCareworkerAge());
        careworkerEntity.setCareworkerState(careworkerDto.getCareworkerState());

        careworkerEntity.setCenterEntity(centerEntity);
        careworkerEntity.setUserEntity(userEntity);

        careworkerRepository.save(careworkerEntity);

        return true;
    }

    // 5. 요양보호사 삭제
    public boolean deleteCareworker(Integer careworkerNo) {
        CareworkerEntity careworkerEntity = careworkerRepository.findById(careworkerNo).orElse(null);

        if ( careworkerEntity == null ) return false;

        careworkerRepository.deleteById(careworkerNo);

        return true;
    }

    // 6. 요양보호사 승인대기상태 조회
    public List<CareworkerDto> getPendingCareworkers(){
        List<CareworkerEntity> careworkerEntities = careworkerRepository.findBySignStatus("승인대기")
        
    }
}