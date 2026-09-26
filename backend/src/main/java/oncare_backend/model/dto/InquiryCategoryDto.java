package oncare_backend.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import oncare_backend.model.entity.InquiryCategoryEntity;

@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class InquiryCategoryDto {
    private Integer inquiry_category_no;        // 문의 카테고리 번호
    private String inquiry_category_name;     // 문의 카테고리 유형 ( 1. 방문 시간 변경 요청 / 2. 방문 요일 변경 요청 / 3. 담당자 관련 문의 / 4.기타 문의)

    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    // 해당 내용은 고정된 카테고리 내용만을 사용하므로, dto -> Entity 변환은 필요가 없음. 

        public static InquiryCategoryDto from(InquiryCategoryEntity entity) {
        return InquiryCategoryDto.builder()
            .inquiry_category_no(entity.getInquiry_category_no())
            .inquiry_category_name(entity.getInquiry_category_name())
            .build();
    }
}
