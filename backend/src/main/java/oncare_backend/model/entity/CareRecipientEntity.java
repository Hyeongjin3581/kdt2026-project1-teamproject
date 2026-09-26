package oncare_backend.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity 
@Table (name = "careRecipients")
@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class CareRecipientEntity extends BaseTime{
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Integer carerecipient_no;
    
    // FK는 JoinColumn으로 받아오기.
    @JoinColumn(name = "guardian_no", nullable = true)
    private Integer guardian_no;

    @Column(nullable = false , length = 50)
    private String carerecipient_name;

    @Column (nullable = false)
    private Integer carerecipient_age;

    @Column (nullable = false )
    private String carerecipient_address;

    @Column (nullable = false)
    private Boolean carerecipient_gender;

    private String careRecipient_content;
}
