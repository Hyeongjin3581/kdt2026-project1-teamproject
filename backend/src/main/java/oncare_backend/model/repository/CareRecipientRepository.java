package oncare_backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.CareRecipientEntity;

@Repository 
public interface  CareRecipientRepository extends JpaRepository <CareRecipientEntity , Integer> {

}
