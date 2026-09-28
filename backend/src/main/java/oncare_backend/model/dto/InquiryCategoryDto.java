package oncare_backend.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.InquiryCategoryEntity;

@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class InquiryCategoryDto {
    private Integer inquiryCategoryNo;        // 문의 카테고리 번호
    private String inquiryCategoryName;     // 문의 카테고리 유형 ( 1. 방문 시간 변경 요청 / 2. 방문 요일 변경 요청 / 3. 담당자 관련 문의 / 4.기타 문의)

    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    // 해당 내용은 고정된 카테고리 내용만을 사용하므로, dto -> Entity 변환은 필요가 없음. 

    // Entity - > Dto
        public static InquiryCategoryDto entityToDto(InquiryCategoryEntity entity) {
        return InquiryCategoryDto.builder()
            .inquiryCategoryNo(entity.getInquiryCategoryNo())
            .inquiryCategoryName(entity.getInquiryCategoryName())
            .build();
    }
}

// 현재 oncare.sql에는 테이블 정의만 있고 카테고리 데이터 삽입은 없음. 
// 화면에 표시하려면 DB에 방문 시간 변경 요청, 방문 요일 변경 요청, 
// 담당자 관련 문의, 기타 문의 행이 먼저 등록되어 있어야함...