package oncare_backend.service;

import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.stereotype.Component;

import oncare_backend.model.entity.CareRecipientEntity;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.entity.RequestEntity;
import oncare_backend.model.entity.UserEntity;

// 탈퇴(회원 상태 delete) 여부 확인
// 서비스 클래스에서 private final ActiveUserCheck activeUserCheck; 로 주입받아 activeUserCheck.isActiveUser(...) 처럼 사용
@Component
public class ActiveUserCheck {

    // 1. 탈퇴하지 않은 회원인지 ( 회원 계정이 연결되지 않았으면 이용 중으로 봄 )
    public boolean isActiveUser(UserEntity userEntity) {
        if (userEntity == null) {
            return true;
        }
        return !"delete".equals(userEntity.getUserState());
    }

    // 2. 서비스요청을 신청한 보호자가 탈퇴하지 않았는지 ( 요청 → 수급자 → 보호자 → 회원 )
    // 보호자 상태(guardianState) 또는 회원 상태(userState) 중 하나라도 delete 면 탈퇴로 봄
    public boolean isActiveGuardian(RequestEntity requestEntity) {
        if (requestEntity == null) {
            return true;
        }
        CareRecipientEntity careRecipientEntity = requestEntity.getCarerecipientEntity();
        if (careRecipientEntity == null) {
            return true;
        }
        GuardianEntity guardianEntity = careRecipientEntity.getGuardianEntity();
        if (guardianEntity == null) {
            return true;
        }
        if ("delete".equals(guardianEntity.getGuardianState())) {
            return false;
        }
        return isActiveUser(guardianEntity.getUserEntity());
    }

    // 3. 화면에서 숨길 방문인지 ( 탈퇴한 보호자의 오늘 이후 방문 )
    // 지난 방문은 근무 기록으로 보존해야 하므로 그대로 보여줌
    public boolean isWithdrawnVisit(RequestEntity requestEntity) {
        if (isActiveGuardian(requestEntity)) {
            return false;
        }
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        if (requestEntity.getVisitDate() == null) {
            return true;
        }
        return !requestEntity.getVisitDate().isBefore(today);
    }
}
