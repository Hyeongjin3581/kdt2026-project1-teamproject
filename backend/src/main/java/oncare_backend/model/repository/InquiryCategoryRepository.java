package oncare_backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.InquiryCategoryEntity;

@Repository 
public interface InquiryCategoryRepository extends JpaRepository <InquiryCategoryEntity , Integer>{

}
