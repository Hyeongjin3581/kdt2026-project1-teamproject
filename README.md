# 온케어 스케줄 · 방문요양 일정 관리 시스템 (KDT 정규프로젝트 1)

방문요양센터의 이용자 · 요양보호사 · 방문 일정을 하나로 연결하고, 거리 · 근무량 · 연속성 점수로 요양보호사를 추천하는 웹 서비스입니다.

| 항목 | 내용 |
| --- | --- |
| 기간 | 2026.09.23 ~ 10.15 |
| 팀 | 4명 |
| 내 역할 | 프론트 + 백엔드 : **요양보호사 추천 점수(상위 3명) · 결원 관리**, 보호자 · 수급자 · 보호자 문의 API |
| 백엔드 | Java 21 · Spring Boot · Spring Data JPA · WebSocket(STOMP) · JWT · MySQL · Redis |
| 프론트 | React 19 · Vite 8 · Tailwind CSS 4 · axios · STOMP |
| 외부 API | Kakao 지오코딩 · Gmail SMTP · Gemini |
| 협업 | Git / GitHub · Jira · Figma |
| 원본 저장소 | [limjunhee/oncare_backend](https://github.com/limjunhee/oncare_backend) · [limjunhee/oncare_frontend](https://github.com/limjunhee/oncare_frontend) |

> 이 저장소는 두 팀 저장소의 `main` 브랜치를 커밋 기록 그대로 `backend/` · `frontend/` 폴더로 합친 사본입니다. 기록에 남아 있던 `application.properties`와 API 키, JVM 오류 로그는 기록에서 제거했습니다.

## 폴더 구성

```txt
backend/    Spring Boot API 서버 (원본 : oncare_backend)
frontend/   React SPA (원본 : oncare_frontend)
```

## 핵심 기능

| 기능 | 내용 |
| --- | --- |
| 관리자 대시보드 | 전체 운영 현황 · 알림 |
| 이용자 · 요양보호사 관리 | 기본정보, 근무 가능 시간, 활동 지역 |
| 요청 자동 매칭 | 서비스 요청 → 필수조건 필터 → 적합도 점수 → 추천 후보 |
| 결원 관리 | 거절 · 취소된 방문에 대체 후보 재추천 |
| 채팅 · 알림 | STOMP 실시간 채팅 |

## 아키텍처

```txt
React SPA (보호자 · 요양보호사 · 관리자) ── axios / STOMP ──▶ Spring Boot (Java 21)
                                              Controller → 쿠키 JWT 검증 · 권한
                                              Service    → 신청 · 배정 · 자동 편성 · 결원 · 알림
                                              Repository → Spring Data JPA
                                    │            │                 │
                                 MySQL     Redis(refresh 토큰)   Kakao 지오코딩 · Gmail SMTP
```

## 팀원별 담당

| 팀원 | 담당 |
| --- | --- |
| **나** | 보호자 · 보호자문의 · 수급자 API, 추천점수 상위 3명 반환 로직, 결원관리 |
| 팀원 A | user · userCategory · center API, 상태변경 API, 외부 API · 웹소켓(채팅) |
| 팀원 B | 요양보호사 근무기록 · 배정 API, Google SMTP 이메일 인증 |
| 팀원 C | 요양보호사 · 근무가능시간 · 후기 API, Gemini 기반 후기 감정 분석 |

## 내가 맡은 부분

### 1. 요양보호사 추천 점수 (상위 3명)

필수조건(근무 가능 시간 · 일정 중복)을 통과한 요양보호사에게 100점 만점 점수를 매기고 상위 3명을 반환합니다.

| 점수 | 배점 | 계산 |
| --- | --- | --- |
| 거리 | 50점 | `50 × (1 − 거리 ÷ 25km)`, 25km 이상 0점 (하버사인 공식) |
| 근무량 | 30점 | `30 × (1 − 최근 30일 근무 ÷ 20회)`, 20회 이상 0점 |
| 연속 요양 | 20점 | 같은 수급자 `(요양 횟수 − 1) × 5점`, 최대 20점 |

- 정렬 : 총점 → 거리 → 근무 횟수 → 번호 순 (`shouldComeBefore`)
- 관련 파일 : `backend/src/main/java/oncare_backend/service/CareWorkerRecommendationService.java`

### 2. 결원 관리 (백엔드 + 프론트)

- `GET /vacancy` : 거절 · 확정 후 취소된 방문을 결원으로 보고, 방문 24시간 이내는 긴급 결원으로 먼저 보여줍니다.
- `GET /vacancy/detail` : 거절 · 취소한 요양보호사를 제외한 대체 후보 상위 3명을 반환합니다.
- 관련 파일 : `backend/.../service/VacancyService.java`, `frontend/src/features/admin/vacancy/Vacancy.jsx`

### 3. 보호자 · 수급자 · 보호자 문의 API, 자동편성 화면

- `/guardian` · `/carerecipient` · `/guardianinquiry` CRUD, 로그인한 보호자 본인 확인 추가
- `frontend/src/features/admin/autoScheduling/AutoScheduling.jsx` : 주간 배정 초안, 담당자 지정 · 변경 · 제외

## 트러블슈팅 : 거절한 요양보호사가 다시 추천됨

| 단계 | 내용 |
| --- | --- |
| 문제 | 배정을 거절한 요양보호사가 재추천에서 다시 1순위(77.1점)로 나왔습니다. |
| 원인 | 거절하면 근무기록이 '취소'로 바뀌고, 일정 겹침 검사가 취소 기록을 건너뛰어 필수조건을 통과했습니다. |
| 해결 | 취소 기록의 요양보호사 번호를 `excludedNo`에 모아 후보에서 제외했습니다. |
| 결과 | 거절한 요양보호사가 빠지고 나머지 후보만 출력됐고, 결원 관리의 '대체 후보 재추천'으로 이어졌습니다. |

## 회고 (KPT)

- **Keep** : 기본 CRUD를 먼저 완성한 뒤 추천 · 배정 · 결원 · 채팅 기능을 단계적으로 덧붙여 안정적으로 확장했습니다.
- **Problem** : Endpoint 경로가 통일되지 않아 토큰 검사 코드가 컨트롤러마다 흩어졌습니다.
- **Try** : Endpoint를 통일해 WebConfig에서 한 번에 토큰을 검사하겠습니다.

## 실행 방법

1. `backend/src/main/resources/application.properties`를 만들고 아래 값을 채웁니다. (키 값은 저장소에 올리지 않습니다)

   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/oncare
   spring.datasource.username=root
   spring.datasource.password=
   spring.data.redis.host=localhost
   spring.data.redis.port=6379
   spring.mail.username=
   spring.mail.password=
   jwt.secret=
   kakao.rest-api-key=
   api.gemini-key=
   api.gemini-model=
   ```
2. 백엔드 : `cd backend` → `./gradlew bootRun` (localhost:8080)
3. 프론트 : `cd frontend` → `npm install` → `npm run dev` (localhost:5173)

> 관련 개인 프로젝트 : [visit-reservation-api](https://github.com/Hyeongjin3581/visit-reservation-api) — 이 프로젝트에서 맡았던 추천 · 배정 로직을 다시 설계하고 있습니다.
