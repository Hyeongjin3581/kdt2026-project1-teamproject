package oncare_backend.service;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class GeoCodingService {
    @Value("${kakao.rest-api-key}")
    private String serviceKey;

    WebClient webClient = WebClient.builder().build();

    // 주소 -> 경도,위도 추출
    // 주소가 비어 있거나 , 카카오 API 호출에 실패하거나 , 검색 결과가 없으면 null
    public List<Double> getGeoCoding(String address){
        if (address == null || address.isBlank()) return null;

        String url = "https://dapi.kakao.com/v2/local/search/address.json?analyze_type=similar&page=1&query=";
        url += address.split(",")[0];
        url += "&size=1";

        Map<String, Object> response = null;
        try {
            response = webClient.get()
                    .uri(url)
                    .header("Authorization", "KakaoAK " + serviceKey)
                    .retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            System.out.println("지오코딩 오류 발생: " + e);
            return null;
        }
        if (response == null) return null;

        List<Map<String, String>> documents = (List<Map<String,String>>)response.get("documents");
        if (documents == null || documents.isEmpty()) return null;

        Map<String, String> map = documents.get(0);
        double latitude = Double.parseDouble(map.get("y")); // 위도
        double longitude = Double.parseDouble(map.get("x")) ; // 경도
        List<Double> geocode = new ArrayList<>();
        geocode.add(latitude);
        geocode.add(longitude);
        return geocode;
    }
}