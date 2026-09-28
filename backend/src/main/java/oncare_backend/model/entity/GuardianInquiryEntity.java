package oncare_backend.model.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
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

    @JoinColumn (name="guardian_no" , nullable = false)
    @ManyToOne
    private Integer guardianNo;

    @JoinColumn (name="inquiry_category_no", nullable = false)
    @ManyToOne
    private Integer inquiryCategoryNo;

    @Column (nullable = false)
    private LocalDate wishDate;

    @Column(name = "wish_start_time")
    private LocalTime wishStartTime;
    @Column(name = "wish_end_time")
    private LocalTime wishEndTime;
    
    @Column (length = 1000)
    private String inquiryContent;
}
