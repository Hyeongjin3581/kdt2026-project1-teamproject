
package oncare_backend.controller;

import java.util.ArrayList;
import java.util.List;

import oncare_backend.service.AuthChecker;
import oncare_backend.service.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import oncare_backend.model.dto.CareRecipientDto;
import oncare_backend.model.dto.UserDto;
import oncare_backend.model.entity.CareRecipientEntity;
import oncare_backend.model.entity.CareworkerEntity;
import oncare_backend.model.entity.CareworkerReportEntity;
import oncare_backend.model.entity.GuardianEntity;
import oncare_backend.model.entity.RequestEntity;
import oncare_backend.model.repository.CareRecipientRepository;
import oncare_backend.model.repository.CareWorkerReportRepository;
import oncare_backend.model.repository.CareworkersRepository;
import oncare_backend.model.repository.GuardianRepository;
import oncare_backend.service.CareRecipientService;
import oncare_backend.service.JwtUtil;
import oncare_backend.service.UserService;

@RestController
@RequestMapping("/carerecipient")
public class CareRecipientController {

    @Autowired private CareRecipientService careRecipientService;
    @Autowired private CareRecipientRepository careRecipientRepository;
    @Autowired private GuardianRepository guardianRepository;
    @Autowired private CareworkersRepository careworkersRepository;
    @Autowired private CareWorkerReportRepository careWorkerReportRepository;
    @Autowired private UserService userService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private AuthChecker authChecker;

    // 로그인 사용자 확인
    private UserDto getLoginUser(String accessToken) {
        if (accessToken == null) return null;

        Integer loginUserNo = jwtUtil.getUserNoFromAccessToken(accessToken);
        if (loginUserNo == null) return null;

        return userService.findById(loginUserNo);
    }

    // 로그인 보호자 확인 (카테고리 1번)
    private GuardianEntity getLoginGuardian(String accessToken) {
        UserDto userDto = getLoginUser(accessToken);
        if (userDto == null) return null;
        if (!Integer.valueOf(1).equals(userDto.getUserCategoryNo())) return null;

        return guardianRepository.findByUserEntity_UserNo(userDto.getUserNo());
    }

	// 1. 수급자 등록 --> 보호자(1)만
	@PostMapping("")
	public boolean CareRecipientSave(@CookieValue(value = "accessToken", required = false)String token,
                                     @RequestBody CareRecipientDto careRecipientDto) {
        Integer no = jwtUtil.getUserNoFromAccessToken(token);
        if (no == null){
            return false;
        }
        if (!authChecker.hasRole(token,1)){
            return false;
        }
        return careRecipientService.CareRecipientSave(careRecipientDto);
	}

    // 2. 수급자 전체 조회 (역할별 권한)
    @GetMapping("")
    @Transactional(readOnly = true)
    public List<CareRecipientDto> CareRecipientFindAll(
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        UserDto userDto = getLoginUser(accessToken);
        if (userDto == null || userDto.getUserCategoryNo() == null) return new ArrayList<>();

        Integer categoryNo = userDto.getUserCategoryNo();
        List<CareRecipientDto> allRecipients = careRecipientService.CareRecipientFindAll();

        // 관리자: 전체 조회
        if (categoryNo == 3 || categoryNo == 4) return allRecipients;

        // 보호자: 본인 수급자만 조회
        if (categoryNo == 1) {
            GuardianEntity guardian = guardianRepository.findByUserEntity_UserNo(userDto.getUserNo());
            if (guardian == null) return new ArrayList<>();

            List<CareRecipientDto> result = new ArrayList<>();
            for (CareRecipientDto dto : allRecipients) {
                if (guardian.getGuardianNo().equals(dto.getGuardianNo())) result.add(dto);
            }
            return result;
        }

        // 요양보호사: 담당 근무의 수급자만 조회
        if (categoryNo == 2) {
            CareworkerEntity careworker = careworkersRepository.findByUserEntity_UserNo(userDto.getUserNo()).orElse(null);
            if (careworker == null) return new ArrayList<>();

            List<CareworkerReportEntity> reports = careWorkerReportRepository.findByCareworkerEntity_CareworkerNo(careworker.getCareworkerNo());
            List<Integer> recipientNos = new ArrayList<>();

            for (CareworkerReportEntity report : reports) {
                RequestEntity request = report.getRequestEntity();
                if (request == null) continue;

                CareRecipientEntity recipient = request.getCarerecipientEntity();
                if (recipient == null) continue;

                Integer recipientNo = recipient.getCareRecipientNo();
                if (recipientNo != null && !recipientNos.contains(recipientNo)) recipientNos.add(recipientNo);
            }

            List<CareRecipientDto> result = new ArrayList<>();
            for (CareRecipientDto dto : allRecipients) {
                if (recipientNos.contains(dto.getCareRecipientNo())) result.add(dto);
            }
            return result;
        }

        return new ArrayList<>();
    }

    // 3. 수급자 상세 조회
    @GetMapping("/detail")
    @Transactional(readOnly = true)
    public CareRecipientDto CareRecipientinquiry(@RequestParam Integer careRecipientNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (careRecipientNo == null) return null;

        List<CareRecipientDto> recipients = CareRecipientFindAll(accessToken);
        for (CareRecipientDto dto : recipients) {
            if (careRecipientNo.equals(dto.getCareRecipientNo())) return dto;
        }
        return null;
    }

    // 4. 수급자 수정 (본인 보호자만)
    @PutMapping("")
    public boolean CareRecipientModify(@RequestBody CareRecipientDto careRecipientDto,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        GuardianEntity guardian = getLoginGuardian(accessToken);
        if (guardian == null || careRecipientDto == null || careRecipientDto.getCareRecipientNo() == null) return false;

        if (careRecipientDto.getCareRecipientName() == null ||
            careRecipientDto.getCareRecipientAge() == null ||
            careRecipientDto.getCareRecipientAddress() == null ||
            careRecipientDto.getCareRecipientGender() == null) return false;

        CareRecipientEntity recipient = careRecipientRepository.findById(careRecipientDto.getCareRecipientNo()).orElse(null);
        if (recipient == null || recipient.getGuardianEntity() == null) return false;

        Integer loginGuardianNo = guardian.getGuardianNo();
        Integer recipientGuardianNo = recipient.getGuardianEntity().getGuardianNo();
        if (!loginGuardianNo.equals(recipientGuardianNo)) return false;

        careRecipientDto.setGuardianNo(loginGuardianNo);
        return careRecipientService.CareRecipientModify(careRecipientDto);
    }

    // 5. 수급자 삭제 (본인 보호자만)
    @DeleteMapping("")
    public boolean CareRecipientDelete(@RequestParam Integer careRecipientNo,
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        GuardianEntity guardian = getLoginGuardian(accessToken);
        if (guardian == null || careRecipientNo == null) return false;

        CareRecipientEntity recipient = careRecipientRepository.findById(careRecipientNo).orElse(null);
        if (recipient == null || recipient.getGuardianEntity() == null) return false;

        Integer loginGuardianNo = guardian.getGuardianNo();
        Integer recipientGuardianNo = recipient.getGuardianEntity().getGuardianNo();
        if (!loginGuardianNo.equals(recipientGuardianNo)) return false;

        return careRecipientService.CareRecipientDelete(careRecipientNo);
    }
}
// 수급자 기본 CRUD
// 수급자 등록(생성)  , 수급자 해제(삭제) , 수급자 특이사항(변경) / 주소(변경) , 수급자 조회(전체조회 / 상세조회(관리자))
