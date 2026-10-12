package oncare_backend.model.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// 문의 응답 팝업 : 기존 근무자 + 희망 시간 기준 추천 3명
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InquiryScheduleOptionDto {
    private Integer currentCareworkerNo;      // 기존 근무자 번호 (배정/확정 근무기록이 없으면 null)
    private String currentCareworkerName;     // 기존 근무자 이름
    private String currentWorkStatus;         // 기존 근무기록 상태 (배정 / 확정)
    private boolean currentAvailable;         // 희망 시간에 근무 가능 여부 → false 면 화면에서 붉게 + 클릭 불가
    private List<CareWorkerRecommendationDto> candidates; // 기존 근무자를 뺀 추천 상위 3명
}