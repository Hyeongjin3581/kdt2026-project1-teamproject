package oncare_backend.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.CareworkerEntity;

@Repository 
public interface CareworkersRepository extends JpaRepository<CareworkerEntity, Integer>{

    List<CareworkerEntity> findBySignState(String signState);

    Optional<CareworkerEntity> findByUserEntity_UserNo(Integer userNo);

    // 센터 번호로 소속 요양보호사 조회 ( 센터 삭제 전 확인용 )
    List<CareworkerEntity> findByCenterEntity_CenterNo(Integer centerNo);
}
