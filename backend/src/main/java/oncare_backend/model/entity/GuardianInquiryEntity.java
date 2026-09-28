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
    private Integer inquiry_no;

    @JoinColumn (name="guardian_no" , nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Integer guardian_no;

    @JoinColumn (name="inquiry_category_no", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Integer inquiry_category_no;

    @Column (nullable = false)
    private LocalDate wish_date;

    private Integer wish_start_time;
    private Integer wish_end_time;
    
    @Column (length = 1000)
    private String inquiry_content;
}
