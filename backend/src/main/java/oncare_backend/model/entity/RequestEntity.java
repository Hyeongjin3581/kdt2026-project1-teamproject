package oncare_backend.model.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity 
@Table (name = "requests")
@Data
@AllArgsConstructor 
@NoArgsConstructor 
@Builder

public class RequestEntity {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer requestNo;

    @Column private String preferredGender;
    @Column private String requestState;
    @Column private LocalDate visitDate;
    @Column private Integer visitStartTime;
    @Column private Integer visitEndTime;
    @Column private String requestContent;

    // 수급자번호 연결
    @JoinColumn (name="carerecipient_no")
    @ManyToOne
    private CareRecipientEntity carerecipientEntity;
}
