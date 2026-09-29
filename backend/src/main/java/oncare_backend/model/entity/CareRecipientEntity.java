package oncare_backend.model.entity;

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
@Table(name = "carerecipients")
@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class CareRecipientEntity extends BaseTime{
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    @Column(name = "carerecipient_no")
    private Integer careRecipientNo;
    
    // FK는 JoinColumn으로 받아오기.
    @JoinColumn(name = "guardian_no", nullable = true)
    @ManyToOne
    private GuardianEntity guardianEntity;

    @Column(name = "carerecipient_name", nullable = false, length = 50)
    private String careRecipientName;

    @Column(name = "carerecipient_age", nullable = false)
    private Integer careRecipientAge;

    @Column(name = "carerecipient_address", nullable = false)
    private String careRecipientAddress;

    @Column(name = "carerecipient_gender", nullable = false)
    private String careRecipientGender;

    @Column(name = "care_recipient_content")
    private String careRecipientContent;
}
