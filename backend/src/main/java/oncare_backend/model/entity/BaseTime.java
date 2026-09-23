package oncare_backend.model.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@MappedSuperclass // 여러 엔티티가 공통으로 사용하는 매핑 정보(필드)를 상속하기 위한 용도라고 지정하는 어노테이션
@EntityListeners( AuditingEntityListener.class ) // JPA Auditing
public class BaseTime {
    // 1. 레코드 생성 시점 가져오는 어노테이션 -> CreatedDate
    @CreatedDate
    private LocalDateTime createDate;

    // 2. 마지막으로 레코드를 수정한 시점을 자동 갱신하는 어노테이션 -> LastModifiedDate
    @LastModifiedDate
    private LocalDateTime updateDate;
}
