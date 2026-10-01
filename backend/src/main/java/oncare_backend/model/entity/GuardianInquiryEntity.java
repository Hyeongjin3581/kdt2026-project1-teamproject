package oncare_backend.model.entity;

import java.time.LocalDate;
import java.time.LocalTime;

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
@Table (name="guardian_inquiry")
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
}
