package oncare_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class OncareBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(OncareBackendApplication.class, args);
	}

}
