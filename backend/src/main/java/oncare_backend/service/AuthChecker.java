package oncare_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import oncare_backend.model.entity.UserEntity;
import oncare_backend.model.repository.UserRepository;

@Component
public class AuthChecker {

    @Autowired private JwtUtil jwtUtil;
    @Autowired private UserRepository userRepository;

    // 로그인 사용자의 카테고리 확인
    public boolean hasRole(String accessToken, int roleNo) {

        if (accessToken == null) return false;

        Integer userNo = jwtUtil.getUserNoFromAccessToken(accessToken);

        if (userNo == null) return false;

        UserEntity user = userRepository.findById(userNo).orElse(null);

        if (user == null || user.getUserCategoryEntity() == null)
            return false;

        Integer categoryNo = user.getUserCategoryEntity().getUserCategoryNo();

        return Integer.valueOf(roleNo).equals(categoryNo);
    }
}
