package oncare_backend.model.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import oncare_backend.model.entity.CareworkerEntity;

import java.util.List;


@Repository 
public interface CareWorkerRepository extends JpaRepository<CareworkerEntity,Integer> {

}
