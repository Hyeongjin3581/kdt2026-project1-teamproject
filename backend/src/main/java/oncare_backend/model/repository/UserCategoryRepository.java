package oncare_backend.model.repository;

import oncare_backend.model.entity.UserCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserCategoryRepository extends JpaRepository<UserCategoryEntity, Integer> {
}
