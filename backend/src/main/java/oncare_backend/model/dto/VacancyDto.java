package oncare_backend.model.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// 10/11일 추가 : 결원관리 화면 조회용 DTO ( 조회 전용이므로 dto -> Entity 변환은 없음 )
@NoArgsConstructor @AllArgsConstructor @Data @Builder
public class VacancyDto {
    private Integer requestNo;                          // 서비스요청 번호 ( 대체자 지정 시 사용 )
    private String vacancyState;                        // 결원 상태 ( 결원 : 대체자 미지정 / 대체요청중 : 대체자 수락 대기 )

    private Integer careRecipientNo;                // 수급자 번호
    private String careRecipientName;             // 수급자 성명
    private String careRecipientAddress;         // 수급자 거주지역

    private LocalDate visitDate;                       // 방문 날짜
    private Integer visitStartTime;                  // 방문 시작시간
    private Integer visitEndTime;                   // 방문 종료시간
    private String preferredGender;                // 선호 성별
    private String requestContent;                 // 요청 내용

    private Integer centerNo;                           // 결원 낸 요양보호사의 센터 번호 ( 센터별 필터용 )
    private List<Integer> cancelledCareworkerNos;    // 거절/취소한 요양보호사 번호 목록 ( 대체 후보에서 제외 )
    private List<String> cancelledCareworkerNames;   // 거절/취소한 요양보호사 이름 목록 ( 화면 표시용 )

    private boolean urgent;                             // 긴급 결원 여부 ( 방문까지 24시간 이내 )
    private long hoursLeft;                              // 방문 시작까지 남은 시간
}

