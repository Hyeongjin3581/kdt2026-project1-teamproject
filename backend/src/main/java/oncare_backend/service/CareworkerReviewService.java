package oncare_backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import oncare_backend.model.dto.CareworkerReviewDto;
import oncare_backend.model.dto.GuardianDto;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.CareworkerReviewEntity;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CareworkerReviewRepository;
import oncare_backend.model.repository.GuardianRepository;

@Service 
public class CareworkerReviewService {
    
    // 최종 후기 저장
    @Autowired private CareworkerReviewRepository careworkerReviewRepository;
    // 몇 번 근무에 관한 후기인지
    @Autowired private CareWorkerReportRepository careWorkerReportRepository;
    // 어떤 보호자의 후기인지
    @Autowired private GuardianRepository guardianRepository;

    // [1] 요양서비스 후기 등록
    public boolean createReview(CareworkerReviewDto reviewDto){
        // 1. 근무기록번호, 보호자번호 null 확인
        if (reviewDto.getCareworkersReportNo() == null || reviewDto.getGuardianNo() == null ) 
            return false;
        // 2. 근무기록 Entity 찾기
        CareworkerReportEntity careworkerReportEntity = 
        careWorkerReportRepository.findById(reviewDto.getCareworkersReportNo()).orElse(null);
        // 3. 보호자 Entity 찾기
        GuardianEntity guardianEntity =
        guardianRepository.findById(reviewDto.getGuardianNo()).orElse(null);
        // 4. 둘 중 하나라도 없으면 false
        if ( careworkerReportEntity == null || guardianEntity == null )
            return false;
        // 5. 완료된 근무인지 확인
        if (!"완료".equals(careworkerReportEntity.getWorkStatus())) 
            return false;
        // 6. 해당 근무에 이미 후기가 있는지 확인
        CareworkerReviewEntity reviewEntity = careworkerReviewRepository
                                                .findByCareworkerReportEntity(
                                                    careworkerReportEntity);
        if (reviewEntity != null) return false;
        
        // 7. 평점 범위 확인 (1~10점)
        if ( reviewDto.getRating() == null )
            return false;
        if ( reviewDto.getRating() < 1 || reviewDto.getRating() > 10 ) 
            return false;
        // 8. DTO -> Entity
        CareworkerReviewEntity careworkerReviewEntity = reviewDto.dtoToEntity();
        // 9. 근무기록 FK 연결
        careworkerReviewEntity.setCareworkerReportEntity(careworkerReportEntity);
        // 10. 보호자 FK 연결
        careworkerReviewEntity.setGuardianEntity(guardianEntity); 
        // 11. save()
        CareworkerReviewEntity savedEntity = careworkerReviewRepository.save(careworkerReviewEntity);
        // 12. PK 생성됐으면 true
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


// [3] 특정 근무기록의 후기 조회
        // 1. careworkersReportNo 확인
        public CareworkerReviewDto getReviewByReport(Integer careworkerReportNo){
            // 2. ReportEntity 찾기 없으면 null
            CareworkerReportEntity careworkerReportEntity = careWorkerReportRepository.findById(careworkerReportNo).orElse(null);
            if ( careworkerReportEntity == null ) return null;
            // 3. ReviewEntity 찾기 없으면 null
            CareworkerReviewEntity careworkerReviewEntity = careworkerReviewRepository.findByCareworkerReportEntity(careworkerReportEntity);
            if ( careworkerReviewEntity == null ) return null;
            // Entity -> Dto 변환 후 반환
            return CareworkerReviewDto.entityToDto(careworkerReviewEntity);
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
        // ※ 마이페이지 '내가 작성한 후기'화면이 필요할 경우 사용


// [5] 후기 수정
        public boolean updateReview(CareworkerReviewDto reviewDto){
        // 1. reviewNo, guardianNo 확인
        if ( reviewDto.getReviewNo() == null || reviewDto.getGuardianNo() == null ) return false; 
        // 2. reviewNo로 기존 후기 찾기
        CareworkerReviewEntity careworkerReviewEntity = 
        careworkerReviewRepository.findById(reviewDto.getReviewNo()).orElse(null);
        // 3. 없으면 false
        if ( careworkerReviewEntity == null ) return false;
        // 4. 실제 작성 보호자와 수정 요청 guardianNo가 같은지 확인
        if ( !reviewDto.getGuardianNo().equals(careworkerReviewEntity.getGuardianEntity().getGuardianNo())) {
            return false;
        }
        // 5. 수정할 값이 하나라도 있는지 확인
        if ( reviewDto.getRating() == null && reviewDto.getReviewContent() == null) 
            return false;
        // 6. rating있으면 범위 확인 후 수정
        if ( reviewDto.getRating() != null ){
            if ( reviewDto.getRating() < 1 || reviewDto.getRating() > 10 )
                return false;
             careworkerReviewEntity.setRating(reviewDto.getRating());
        } 
       
        // 7. reviewContent 있으면 수정
        if (reviewDto.getReviewContent() != null) {
            careworkerReviewEntity.setReviewContent(reviewDto.getReviewContent());
        }
        // 8. save()
        careworkerReviewRepository.save(careworkerReviewEntity); 
        // 9. true 반환
        return true;
        }


// [6] 후기 삭제
        public boolean deleteReview(CareworkerReviewDto reviewDto){
        // 1. reviewNo, guardianNo 확인
        if ( reviewDto.getReviewNo() == null || reviewDto.getGuardianNo() == null ) return false; 
        // 2. reviewNo로 기존 후기 찾기
        CareworkerReviewEntity careworkerReviewEntity = 
        careworkerReviewRepository.findById(reviewDto.getReviewNo()).orElse(null);
        // 3. 없으면 false
        if ( careworkerReviewEntity == null ) return false;
        // 4. 실제 작성 보호자와 삭제 요청 guardianNo가 같은지 확인
        if ( !reviewDto.getGuardianNo().equals(careworkerReviewEntity.getGuardianEntity().getGuardianNo())) {
            return false;
        }
        // 5. delete()
        careworkerReviewRepository.delete(careworkerReviewEntity);
        // 6. true 반환
        return true;
        }
// 다 만들고 권한로직도 만들 예정(본인(요양사)이 본인 후기만 볼 수 있게) // 주소창에서 숫자바꾼다고 다른 후기 못 본다는 말 
}
