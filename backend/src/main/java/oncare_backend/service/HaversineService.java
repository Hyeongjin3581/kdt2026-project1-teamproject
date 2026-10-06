package oncare_backend.service;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class HaversineService {

    // 두 좌표 사이 거리 메소드
    public double distanceKm(double lat1, double lng1, double lat2, double lng2){
        double R = 6371; // 지구의 반지름
        double dLat = Math.toRadians(lat1 - lat2);
        double dLng = Math.toRadians(lng1 - lng2);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // 두 지점 사이의 거리(km)
        return R * c;

    }
}
