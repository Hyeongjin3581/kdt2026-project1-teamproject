package oncare_backend.model.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity 
@Table (name = "careworkersreport")
@NoArgsConstructor 
@AllArgsConstructor 
@Getter @Setter @ToString 
@Builder

public class CareworkerReportEntity {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer careworkersReportNo;
    
    @Column private LocalDate workDate;
    @Column private LocalTime workStartTime;
    @Column private LocalTime workEndTime;
    @Column private String workStatus;

    
    // 요양보호사 연결
    // @JoinColumn (name = "careworker_no")
    // @ManyToOne
    // private CareworkerEntity careworker;

    // 매칭서비스요청 연결
    @ManyToOne (fetch = FetchType.LAZY)
    @JoinColumn (name = "request_no")
    private RequestEntity request;
}
