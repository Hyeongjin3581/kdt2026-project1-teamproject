// 스프링부트 메일 기능(JavaMailSender)과 Google의 SMTP 서버(smtp.gamil.com)를 통해 회원 가입 시 인증메일을 보내는 방식
package oncare_backend.service;

import java.security.SecureRandom;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class EmailVerificationService {
    private final JavaMailSender mailSender; // 스프링이 application.properties 보고 자동으로 생성
    private final StringRedisTemplate stringRedisTemplate;  // (로그인 때 사용하는 redis와 같음)
    private final SecureRandom random = new SecureRandom(); // 인증번호용 SecureRandom

    @Value("${spring.mail.username}")
    private String from; // 발신자 = 발송용 Gmail 주소(oncareschedule@gmail.com)
    
    // [1] 인증번호 발송 메소드
    public boolean send(String email) {
        if (email == null) return false; // 이메일이 비어있으면 false
        email = email.trim().toLowerCase(); // 대소문자, 공백 통일
        
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) return false; // Gmail 형식이 아닐 경우 false
        if (Boolean.TRUE.equals(stringRedisTemplate.hasKey("EVCOOL:"+email))) return false; // 60초동안 발송을 제한
            
        String code = String.format("%06d", random.nextInt(1_000_000)); // 000000~999999 까지 임의의 6자리 코드 생성
        try {
            sendMail(email, code);
        } catch (MailException e) {
            // 발송 실패 시 Redis에 아무것도 저장 X , 바로 다시 시도 가능
            System.out.println("메일 오류 발생: " + e);
            return false;
        }
        stringRedisTemplate.opsForValue().set("EV:" + email, code, Duration.ofMinutes(5));  // 인증번호 5분
        stringRedisTemplate.opsForValue().set("EVCOOL:" + email, "1", Duration.ofSeconds(60));  //재발송 쿨다운 60초
        stringRedisTemplate.delete("EVOK:" + email); // 재발송한 경우라면 이전 인증 완료 상태를 취소해버림

        return true;
    }

    // [2] 인증번호 확인 메소드
    public boolean verify(String email, String code){
        if (email == null || code == null) return false;
        email = email.trim().toLowerCase();

        String saved = stringRedisTemplate.opsForValue().get("EV:"+email); //5분 지났으면 null
        if (saved == null || !saved.equals(code.trim())) return false; // 인증번호를 입력 안했거나, 인증 번호를 다르게 입력했을 경우 false
        
        // 아래는 인증번호 입력을 올바르게 했을 경우 작동
        stringRedisTemplate.delete("EV:"+email);                                                          // 이미 인증 완료한 번호는 redis에서 폐기하기
        stringRedisTemplate.opsForValue().set("EVOK:"+email, "1", Duration.ofMinutes(30)); // 30분 안에 가입 완료
        return true;
    }

    // [3] 가입 시 확인, 정리용 메소드
    public boolean isVerified(String email){ 
        if (email==null) return false;
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey("EVOK:" + email.trim().toLowerCase())); 
    }

    // [4] 가입 완료 후 인증 기록 삭제 (같은 인증으로 두 번 가입하기 방지!)
    public void clear(String email) { 
        if (email == null) return;
        stringRedisTemplate.delete("EVOK:" + email.trim().toLowerCase());
    }

    // [5] 메일 발송 메소드
    private void sendMail(String to, String code){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("[온케어 스케줄] 회원가입 인증번호");
        message.setText("온케어 스케줄 회원가입 인증번호는 [" + code + "] 입니다.\n"
                + "5분 안에 입력해주세요.\n\n본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.");
        mailSender.send(message);
    }
}