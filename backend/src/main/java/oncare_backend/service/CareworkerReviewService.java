package oncare_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import oncare_backend.model.dto.CareworkerReviewDto;
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
        // 1. careworkerNo 확인
        // 2. 해당 요양보호사의 근무기록에 연결된 후기들 조회
        //    Review -> Report -> Careworker 관계 이용
        // 3. Entity List -> DTO List 변환
        // 4. 반환


// [3] 특정 근무기록의 후기 조회
        // 1. careworkersReportNo 확인
        // 2. 해당 근무기록에 작성된 후기 조회
        // 3. 없으면 null
        // 4. Entity -> DTO 변환
        // 5. 반환


// [4] 보호자가 작성한 후기 목록 조회
        // 1. guardianNo 확인
        // 2. 해당 보호자가 작성한 후기들 조회
        // 3. Entity List -> DTO List 변환
        // 4. 반환
        // ※ 마이페이지 '내가 작성한 후기'가 필요할 경우 사용


// [5] 후기 수정
        // 1. reviewNo, guardianNo 확인
        // 2. reviewNo로 기존 후기 찾기
        // 3. 없으면 false
        // 4. 실제 작성 보호자와 수정 요청 guardianNo가 같은지 확인
        // 5. 평점 범위 확인
        // 6. rating, reviewContent 수정
        // 7. save()
        // 8. true 반환


// [6] 후기 삭제
        // 1. reviewNo, guardianNo 확인
        // 2. reviewNo로 기존 후기 찾기
        // 3. 없으면 false
        // 4. 실제 작성 보호자와 삭제 요청 guardianNo가 같은지 확인
        // 5. delete()
        // 6. true 반환
}
