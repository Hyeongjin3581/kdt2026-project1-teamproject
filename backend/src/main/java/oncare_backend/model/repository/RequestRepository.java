package oncare_backend.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.RequestEntity;

@Repository 
public interface RequestRepository extends JpaRepository<RequestEntity, Integer>{
    // 수급자 별 
    List<RequestEntity> findByCarerecipientsEntity_CareRecipientNo(Integer careRecipientNo);
    
    List<RequestEntity> findByCarerecipientsEntity_GuardianEntity_GuardianNo(Integer guardianNo);
}
