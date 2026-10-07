package oncare_backend.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity 
@Table (name = "careworkerreview")
@NoArgsConstructor 
@AllArgsConstructor 
@Getter @Setter @ToString 
@Builder 
public class CareworkerReviewEntity extends BaseTime{
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer reviewNo;

    @Column private Double rating;
    @Column private String reviewContent;

    // 근무기록 연결 : 한 근무당 후기 한 개
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "careworkers_report_no",
        nullable = false,
        unique = true
    )
    private CareworkerReportEntity careworkerReportEntity;

    // 보호자 연결 : 보호자 한 명이 여러 후기 작성 가능
    @JoinColumn (name = "guardian_no")
    @ManyToOne (fetch = FetchType.LAZY)
    private GuardianEntity guardianEntity;

}
