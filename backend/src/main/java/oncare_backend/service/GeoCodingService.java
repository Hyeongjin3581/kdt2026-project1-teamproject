package oncare_backend.service;

import jakarta.transaction.Transactional;
import oncare_backend.model.dto.CareworkerDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@Transactional
public class GeoCodingService {
    @Value("${kakao.rest-api-key}")
    private String serviceKey;

    WebClient webClient = WebClient.builder().build();

    public double getLongitude(CareworkerDto careworkerDto){
        String url = "https://dapi.kakao.com/v2/local/search/address.json?analyze_type=similar&page=1&query=";
        url += careworkerDto.getCareworkerAddress();
        url += "&size=1";

        Map<String, Object> response = webClient.get()
                .uri(url)
                .header("Authorization", "KakaoAK " + serviceKey)
                .retrieve().bodyToMono(Map.class).block();

        List<Map<String, Object>> documents = (List<Map<String,Object>>)response.get("documents");
        Map<String, Object> map = documents.get(0);
        double longitude = Double.parseDouble((String)map.get("x")) ;
        return longitude;
    }

    public double getLatitude(CareworkerDto careworkerDto){
        String url = "https://dapi.kakao.com/v2/local/search/address.json?analyze_type=similar&page=1&query=";
        url += careworkerDto.getCareworkerAddress();
        url += "&size=1";

        Map<String, Object> response = webClient.get()
                .uri(url)
                .header("Authorization", "KakaoAK " + serviceKey)
                .retrieve().bodyToMono(Map.class).block();

        List<Map<String, String>> documents = (List<Map<String,String>>)response.get("documents");
        Map<String, String> map = documents.get(0);
        double latitude = Double.parseDouble(map.get("y")) ;
        return latitude;
    }
}
