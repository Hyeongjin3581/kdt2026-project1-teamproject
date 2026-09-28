package oncare_backend.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity 
@Table (name="inquiry_category")
@NoArgsConstructor @AllArgsConstructor @Data @Builder 
public class InquiryCategoryEntity {
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Integer inquiry_category_no;
    
    @Column (nullable = false , length = 50)
    private String inquiry_category_name;
}
