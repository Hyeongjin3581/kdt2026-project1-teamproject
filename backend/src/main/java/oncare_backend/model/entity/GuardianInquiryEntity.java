package oncare_backend.model.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table (name="guardianinquiry")
@NoArgsConstructor @AllArgsConstructor @Data @Builder
public class GuardianInquiryEntity extends BaseTime{
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    @Column(name = "inquiry_no")
    private Integer inquiryNo;

    @ManyToOne
    @JoinColumn(name = "guardian_no", nullable = false)
    private GuardianEntity guardianEntity;

    @ManyToOne
    @JoinColumn(name = "inquiry_category_no", nullable = false)
    private InquiryCategoryEntity inquiryCategoryEntity;

    @Column (nullable = true)
    private LocalDate wishDate;

    @Column(name = "wish_start_time")
    private Integer wishStartTime;
    @Column(name = "wish_end_time")
    private Integer wishEndTime;

    @Column (length = 1000)
    private String inquiryContent;

    // 문의 대상 방문(서비스 요청) : 보호자가 화면에서 '선택한 방문 일정'
    // 예전 데이터와 연결이 끊긴 문의가 있으므로 null 허용
    @ManyToOne
    @JoinColumn(name = "request_no", nullable = true)
    private RequestEntity requestEntity;

    // 관리자 응답 : null 이면 '응답 대기', 값이 있으면 '응답 완료'
    @Column (length = 1000)
    private String answerContent;

    // 응답(수정) 일시
    private LocalDateTime answerDate;

    // 이 문의의 희망 일정으로 배정 변경한 일시 (응답 수정 때는 바뀌지 않음, 배정 변경을 안 했으면 null)
    private LocalDateTime scheduleAppliedDate;

    // 묶음 번호 : 보호자가 '요청 보내기' 한 번에 함께 보낸 문의(희망 날짜마다 1건)끼리 같은 값. 예전 데이터는 null
    @Column (length = 50)
    private String inquiryGroup;
}
