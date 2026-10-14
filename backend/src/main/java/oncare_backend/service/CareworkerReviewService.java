package oncare_backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import oncare_backend.model.dto.CareworkerReviewDto;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.CareworkerReviewEntity;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CareworkerReviewRepository;
import oncare_backend.model.repository.CareworkersRepository;
import oncare_backend.model.repository.GuardianRepository;

@Service 
public class CareworkerReviewService {
    
    // 최종 후기 저장
    @Autowired private CareworkerReviewRepository careworkerReviewRepository;
    // 몇 번 근무에 관한 후기인지
    @Autowired private CareWorkerReportRepository careWorkerReportRepository;
    // 어떤 보호자의 후기인지
    @Autowired private GuardianRepository guardianRepository;

    @Autowired private CareworkersRepository careworkersRepository;

    // [1] 요양서비스 후기 등록
    public boolean createReview(CareworkerReviewDto reviewDto, Integer loginUserNo){
        // 1. 근무기록번호, 확인
        if (reviewDto.getCareworkersReportNo() == null) 
            return false;
        // 2. 로그인한 사용자로 보호자 찾기
        GuardianEntity guardianEntity =guardianRepository
        .findByUserEntity_UserNo(loginUserNo);
        if (guardianEntity == null) return false;

        // 3. 근무기록 찾기
        CareworkerReportEntity careworkerReportEntity = careWorkerReportRepository
        .findById(reviewDto.getCareworkersReportNo())
        .orElse(null);
        if (careworkerReportEntity == null) return false;

        // 4. 완료된 근무인지 확인
        if (!"완료".equals(careworkerReportEntity.getWorkStatus())) 
            return false;
        // 5. 해당 근무에 이미 후기가 있는지 확인
        CareworkerReviewEntity reviewEntity = careworkerReviewRepository
                                                .findByCareworkerReportEntity(
                                                    careworkerReportEntity);
        if (reviewEntity != null) return false;
        
        // 6. 평점 범위 확인 (1~10점)
        if ( reviewDto.getRating() == null )
            return false;
        if ( reviewDto.getRating() < 1 || reviewDto.getRating() > 10 ) 
            return false;
        // 7. DTO -> Entity
        CareworkerReviewEntity careworkerReviewEntity = reviewDto.dtoToEntity();
        // 8. 근무기록 FK 연결
        careworkerReviewEntity.setCareworkerReportEntity(careworkerReportEntity);
        // 9. 보호자 FK 연결
        careworkerReviewEntity.setGuardianEntity(guardianEntity); 
        // 10. save()
        CareworkerReviewEntity savedEntity = careworkerReviewRepository.save(careworkerReviewEntity);
        // 11. PK 생성됐으면 true
        if ( savedEntity.getReviewNo() >= 1)
        return true;

    return false;
}

// [2] 요양보호사별 받은 후기 목록 조회
    // careworkerNo 입력받기
    public List<CareworkerReviewDto> getReviewsByCareworker(Integer careworkerNo){
        // 해당 요양보호사가 받은 후기 Entity 조회 
            List<CareworkerReviewEntity> workerReviewsList = 
            careworkerReviewRepository.findByCareworkerReportEntity_CareworkerEntity_CareworkerNo(careworkerNo);
        // Entity List를 Dto로 변환후 반환
            return workerReviewsList.stream().map(careworkerReviewEntity -> 
                CareworkerReviewDto.entityToDto(careworkerReviewEntity)).toList();
        }
        // [2-1] 인증
        public List<CareworkerReviewDto> getReviewsByLoginUser(Integer loginUserNo) {
            // 1. loginUserNo로 CareworkerEntity 찾기
            CareworkerEntity careworkerEntity = careworkersRepository.findByUserEntity_UserNo(loginUserNo).orElse(null);
            // 2. 없으면 null 또는 빈 리스트 반환
            if ( careworkerEntity == null ) return List.of(); 
            // 3. careworkerNo 꺼내기
            Integer careworkerNo = careworkerEntity.getCareworkerNo();
            // 4. 기존 후기 Repository로 해당 요양보호사 후기 조회
            return getReviewsByCareworker(careworkerNo);
        }

// [3] 특정 근무기록 후기 조회 + 권한 확인
    public CareworkerReviewDto getReviewByReport( Integer careworkerReportNo, Integer loginUserNo){
        // 1. 근무기록 찾기
        CareworkerReportEntity careworkerReportEntity = careWorkerReportRepository
                .findById(careworkerReportNo)
                .orElse(null);
        if (careworkerReportEntity == null)
            return null;

    // 2. 후기 찾기
    CareworkerReviewEntity careworkerReviewEntity = careworkerReviewRepository
            .findByCareworkerReportEntity(careworkerReportEntity);
    if (careworkerReviewEntity == null)
        return null;

    // 3. 로그인 사용자가 보호자인지 확인
    GuardianEntity guardianEntity = guardianRepository
            .findByUserEntity_UserNo(loginUserNo);

    if (guardianEntity != null) {
        if (guardianEntity.getGuardianNo().equals(
                careworkerReviewEntity
                    .getGuardianEntity()
                    .getGuardianNo())) {
            return CareworkerReviewDto
                .entityToDto(careworkerReviewEntity);
        }
    }

    // 4. 로그인 사용자가 해당 요양보호사인지 확인
    CareworkerEntity careworkerEntity =
        careworkersRepository
            .findByUserEntity_UserNo(loginUserNo)
            .orElse(null);

    if (careworkerEntity != null) {

        if (careworkerEntity.getCareworkerNo().equals(
                careworkerReportEntity
                    .getCareworkerEntity()
                    .getCareworkerNo())) {

            return CareworkerReviewDto
                .entityToDto(careworkerReviewEntity);
        }
    }

    // 보호자도 아니고 해당 요양보호사도 아니면 차단
    return null;
}

// [4] 보호자가 작성한 후기 목록 조회
        // 1. guardianNo 확인
        public List<CareworkerReviewDto> getReviewsByGuardian(Integer guardianNo){
        // 2. 해당 보호자가 작성한 후기들 조회
            List<CareworkerReviewEntity> guardianReviewsList =
            careworkerReviewRepository.findByGuardianEntity_GuardianNo(guardianNo);
        // 3. Entity List -> DTO List 변환후 반환
            return guardianReviewsList.stream().map(careworkerReviewEntity ->
                CareworkerReviewDto.entityToDto(careworkerReviewEntity)).toList();
        }
// [4-1] 로그인한 보호자 본인 후기 조회
        public List<CareworkerReviewDto> getReviewsByGuardianLoginUser(
            Integer loginUserNo
        ){
            GuardianEntity guardianEntity = guardianRepository.findByUserEntity_UserNo(loginUserNo);
         if (guardianEntity == null) return List.of();

         Integer guardianNo = guardianEntity.getGuardianNo();
         return getReviewsByGuardian(guardianNo);
}

// [5] 후기 수정
    public boolean updateReview(CareworkerReviewDto reviewDto,Integer loginUserNo){
    // 1. reviewNo 확인
        if (reviewDto.getReviewNo() == null) return false;

    // 2. 로그인한 보호자 찾기
        GuardianEntity guardianEntity = guardianRepository
        .findByUserEntity_UserNo(loginUserNo);
        if (guardianEntity == null) return false;

    // 3. 수정할 후기 찾기
    CareworkerReviewEntity careworkerReviewEntity = careworkerReviewRepository
            .findById(reviewDto.getReviewNo())
            .orElse(null);

    if (careworkerReviewEntity == null) return false;

    // 4. 로그인한 보호자가 실제 작성자인지 확인
    if (!guardianEntity.getGuardianNo().equals(
            careworkerReviewEntity.getGuardianEntity().getGuardianNo())) {
        return false;
    }
    // 5. 수정할 값이 하나라도 있는지
    if (reviewDto.getRating() == null
            && reviewDto.getReviewContent() == null)
        return false;
    // 6. rating 수정
    if (reviewDto.getRating() != null) {
        if (reviewDto.getRating() < 1
                || reviewDto.getRating() > 10)
            return false;
        careworkerReviewEntity.setRating(
            reviewDto.getRating());
    }
    // 7. 내용 수정
    if (reviewDto.getReviewContent() != null) {
        careworkerReviewEntity.setReviewContent(
            reviewDto.getReviewContent());
    }
    // 8. 저장
    careworkerReviewRepository.save(
        careworkerReviewEntity);

    return true;
}


    // [6] 후기 삭제
        public boolean deleteReview(CareworkerReviewDto reviewDto,Integer loginUserNo){
        // 1. reviewNo 확인
            if (reviewDto.getReviewNo() == null) return false;
        // 2. 로그인한 보호자 찾기
            GuardianEntity guardianEntity = guardianRepository.findByUserEntity_UserNo(loginUserNo);
            if (guardianEntity == null) return false;

        // 3. 후기 찾기
            CareworkerReviewEntity careworkerReviewEntity = careworkerReviewRepository
            .findById(reviewDto.getReviewNo())
            .orElse(null);
            if (careworkerReviewEntity == null) return false;
        // 4. 로그인 보호자가 실제 작성자인지 확인
            if (!guardianEntity.getGuardianNo().equals(
                careworkerReviewEntity
                .getGuardianEntity()
                .getGuardianNo())) {
                    return false;}
        // 5. 삭제
            careworkerReviewRepository.delete(careworkerReviewEntity);
            return true;
}
}
