package oncare_backend.model.repository;

import oncare_backend.model.entity.CenterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CenterRepository extends JpaRepository<CenterEntity, Integer> {
}
