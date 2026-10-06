package oncare_backend.service;

import org.springframework.stereotype.Service;

@Service
public class CareWorkerRecommendationPolicyService {

    // V1은 연장근로 합의 정보가 없어 40시간까지 추천합니다. 향후 정보가 생기면 정책을 변경합니다.
    public static final int MAX_AUTO_RECOMMEND_WEEKLY_MINUTES = 40 * 60;
    public static final double MAX_MATCH_DISTANCE_KM = 15.0;
    public static final int NOT_RECOMMENDABLE_SCORE = -1;

    private static final double DISTANCE_NEAR_KM = 2.0;
    private static final double DISTANCE_MIDDLE_KM = 5.0;
    private static final double DISTANCE_FAR_KM = 10.0;
    private static final int DISTANCE_NEAR_SCORE = 80;
    private static final int DISTANCE_MIDDLE_SCORE = 60;
    private static final int DISTANCE_FAR_SCORE = 40;
    private static final int DISTANCE_OUTER_SCORE = 20;

    private static final int WORKLOAD_LOW_MINUTES = 20 * 60;
    private static final int WORKLOAD_MIDDLE_MINUTES = 30 * 60;
    private static final int WORKLOAD_HIGH_MINUTES = 35 * 60;
    private static final int WORKLOAD_LOW_SCORE = 19;
    private static final int WORKLOAD_MIDDLE_SCORE = 14;
    private static final int WORKLOAD_HIGH_SCORE = 8;
    private static final int WORKLOAD_MAX_SCORE = 3;

    // 거리가 정상적인 숫자이고 0~15km 안에 있는지 확인합니다.
    public boolean isWithinDistanceLimit(double distanceKm) {
        return Double.isFinite(distanceKm)
                && distanceKm >= 0
                && distanceKm <= MAX_MATCH_DISTANCE_KM;
    }

    // 현재 근무와 새 근무를 합쳐 주 40시간 이내인지 확인합니다. 입력 단위는 분입니다.
    public boolean isWithinWeeklyLimit(int currentWeeklyWorkMinutes, int requestWorkMinutes) {
        if (currentWeeklyWorkMinutes < 0 || requestWorkMinutes < 0) {
            return false;
        }
        if (currentWeeklyWorkMinutes > MAX_AUTO_RECOMMEND_WEEKLY_MINUTES) {
            return false;
        }
        // 먼저 남은 시간과 비교하면 큰 정수를 더할 때 생기는 오버플로를 피할 수 있습니다.
        return requestWorkMinutes <= MAX_AUTO_RECOMMEND_WEEKLY_MINUTES - currentWeeklyWorkMinutes;
    }

    // 거리와 주간 근무시간 조건을 모두 만족하는 후보인지 확인합니다.
    public boolean isRecommendable(double distanceKm, int currentWeeklyWorkMinutes, int requestWorkMinutes) {
        return isWithinDistanceLimit(distanceKm)
                && isWithinWeeklyLimit(currentWeeklyWorkMinutes, requestWorkMinutes);
    }

    // 거리 구간에 따라 점수를 계산합니다. 비정상 입력이나 거리 초과는 -1입니다.
    public int calculateDistanceScore(double distanceKm) {
        if (!isWithinDistanceLimit(distanceKm)) {
            return NOT_RECOMMENDABLE_SCORE;
        }
        if (distanceKm <= DISTANCE_NEAR_KM) {
            return DISTANCE_NEAR_SCORE;
        } else if (distanceKm <= DISTANCE_MIDDLE_KM) {
            return DISTANCE_MIDDLE_SCORE;
        } else if (distanceKm <= DISTANCE_FAR_KM) {
            return DISTANCE_FAR_SCORE;
        } else {
            return DISTANCE_OUTER_SCORE;
        }
    }

    // 배정 후 예상 주간 근무시간으로 여유 점수를 계산합니다. 음수나 40시간 초과는 -1입니다.
    public int calculateWorkloadScore(int expectedWeeklyMinutes) {
        if (expectedWeeklyMinutes < 0 || expectedWeeklyMinutes > MAX_AUTO_RECOMMEND_WEEKLY_MINUTES) {
            return NOT_RECOMMENDABLE_SCORE;
        }
        if (expectedWeeklyMinutes <= WORKLOAD_LOW_MINUTES) {
            return WORKLOAD_LOW_SCORE;
        } else if (expectedWeeklyMinutes <= WORKLOAD_MIDDLE_MINUTES) {
            return WORKLOAD_MIDDLE_SCORE;
        } else if (expectedWeeklyMinutes <= WORKLOAD_HIGH_MINUTES) {
            return WORKLOAD_HIGH_SCORE;
        } else {
            return WORKLOAD_MAX_SCORE;
        }
    }

    // 추천 가능한 후보의 거리 점수와 근무여유 점수를 더합니다. 제외 대상은 -1입니다.
    public int calculateTotalScore(double distanceKm, int currentWeeklyWorkMinutes, int requestWorkMinutes) {
        if (!isRecommendable(distanceKm, currentWeeklyWorkMinutes, requestWorkMinutes)) {
            return NOT_RECOMMENDABLE_SCORE;
        }
        int expectedWeeklyMinutes = currentWeeklyWorkMinutes + requestWorkMinutes;
        return calculateDistanceScore(distanceKm) + calculateWorkloadScore(expectedWeeklyMinutes);
    }
}
