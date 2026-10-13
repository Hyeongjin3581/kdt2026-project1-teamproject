# 후기 기능 구현 결과 (2026-10-13)

## A. 구현 완료 기능

- 보호자: 기존 방문 기록에서 수급자 선택, 후기 작성·보기·수정·삭제를 제공한다. 수급자 선택은 GuardianApp의 기존 상태를 사용한다.
- 실제 근무번호가 있고 `workStatus === "완료"`인 행만 후기 작성·수정 버튼을 제공한다. 기존 `done`에 따른 방문기록 표시 정책은 유지한다.
- 요양보호사: 기존 업무 기록에서 근무번호로 받은 후기를 연결하고, 읽기 전용 모달에서 확인한다.
- 평점 입력은 1~10 정수, 표시는 별 5개와 반 별 및 원본 N/10점이다. 서버에는 원본 정수를 전송한다.
- 내용은 선택 입력, 최대 200자이며 공백만 있거나 내용을 지웠다면 `reviewContent: ""`를 전송한다.
- 모든 후기 요청은 쿠키 옵션을 사용한다. 변경 응답은 boolean `true`만 성공으로 처리하며, 성공 뒤 목록을 다시 조회한다.
- 조회 중/빈 목록/조회 실패를 구분한다. 실패 시 재시도를 제공하고 새 후기를 잘못 작성하도록 버튼을 제공하지 않는다.
- 수급자 전환 시 기록 컴포넌트를 새로 마운트하고 이전 조회를 취소한다. 요양보호사 전환·컴포넌트 해제·재조회도 이전 요청을 취소한다.
- 모달은 ESC·배경 클릭·닫기 버튼, 키보드 초점 순환을 지원한다. 저장·삭제 중 닫기 및 중복 요청을 차단한다.

## B. 수정 및 추가 파일

| 파일 | 변경 내용 |
| --- | --- |
| `src/features/guardian/GuardianApp.jsx` | 방문 기록에 기존 수급자 목록·선택 함수를 전달하고, 수급자별 key로 이전 화면 상태를 제거 |
| `src/utils/guardianAdapters.js` | 기존 근무번호와 함께 실제 `workStatus` 보존 |
| `src/features/guardian/records/GuardianRecords.jsx` | 수급자 선택, 후기 목록 조회·근무번호 매칭·상태별 버튼·재조회 |
| `src/features/guardian/records/GuardianReviewModal.jsx` | 평점·내용 입력 및 등록·수정·삭제 API 연결 |
| `src/features/caregiver/records/CaregiverRecords.jsx` | 기존 필터를 유지하며 받은 후기 열·재시도·읽기 전용 모달 연결 |
| `src/features/caregiver/records/CaregiverReviewModal.jsx` | 방문 정보·평점·내용·작성일 표시, 변경 기능 없음 |
| `src/components/common/ReviewRating.jsx` | 5개 별의 빈 별·반 별·채운 별과 원본 점수 표시 |
| `src/components/common/ReviewDialog.jsx` | 두 후기 모달의 오버레이·닫기·초점·키보드 동작 공유 |
| `tests/review.html`, `tests/review-browser.jsx` | 제품 화면과 분리된 모의 API 브라우저 검증 |
| `tests/run-review-browser.mjs` | 별도 패키지 없이 설치된 Chrome으로 검증 실행 |

## C. API 연결과 데이터 흐름

| API | 연결 위치 |
| --- | --- |
| `GET /api/review/guardian/my` | GuardianRecords: 보호자가 작성한 목록을 한 번 가져와 `careworkersReportNo`로 매칭 |
| `POST /api/review` | GuardianReviewModal: `careworkersReportNo`, `rating`, `reviewContent` 전송 |
| `PUT /api/review` | GuardianReviewModal: `reviewNo`, `rating`, `reviewContent` 전송 |
| `DELETE /api/review` | GuardianReviewModal: Axios `data: { reviewNo }`로 JSON 본문 전송 |
| `GET /api/review/careworker/my` | CaregiverRecords: 본인 받은 목록을 `reportNo`와 매칭 |

기존 Vite `/api` 프록시를 사용한다. 상세는 이미 받은 후기 DTO로 표시하여 행마다 추가 조회하지 않는다. `GET /api/review/detail`은 호출할 필요가 없어 사용하지 않았다. 사용자 번호를 후기 요청에 하드코딩하거나 토큰을 읽고 저장하지 않는다.

흐름: 기존 방문/근무기록 조회 → 본인 후기 목록 조회 → 근무번호로 매칭 → 모달 → 실제 변경 API 요청 → boolean true 확인 → 모달 닫기 → 후기 목록 재조회. 재조회 실패는 저장 성공 안내와 별도로 표시하며 이전 후기를 빈 목록으로 취급하지 않는다.

## D. 직접 확인한 결과

- `npm run build` 성공. 기존과 같은 500 kB 초과 번들 경고는 남아 있다.
- Chrome에서 모의 API를 사용한 52개 검증 항목 통과: 모바일 390×844, 데스크톱 1440×900 각각 실행.
- 검증 범위: 1~10점 전체 반 별 변환, 미완료/근무번호 없음 작성 차단, 수급자 제한·전환·선택 유지·늦은 응답, 빈 내용 POST/PUT, 200자 초과 요청 차단, 성공 후 목록 갱신, false/통신 실패 처리, 삭제 취소와 JSON 본문, 중복 요청·처리 중 닫기 차단, 키보드 초점 순환·ESC·배경 닫기, 요양보호사 읽기 전용·근무번호 매칭·검색/날짜/새로고침, 역할/수급자 데이터 제거, 모바일 표 스크롤, 쿠키 옵션.
- 모바일 모달 캡처를 직접 확인했다.
- 실행 중인 백엔드에 **로그인 쿠키 없이** 직접 후기 목록을 요청했으며 HTTP 200과 `[]`를 확인했다. Vite를 통한 보호자/요양보호사 후기 목록도 HTTP 200과 `[]`였다.
- 위 HTTP 결과는 서버 연결과 프록시 경로 확인이다. 실제 로그인 사용자 후기 조회나 저장 성공을 증명하지 않는다.
- `git diff --check` 통과.

모의 브라우저 검증을 다시 실행하려면 프로젝트 폴더에서 다음을 사용한다. 기존 개발 서버가 있으면 첫 명령은 생략한다.

```powershell
npm run dev
# 다른 터미널에서:
node tests/run-review-browser.mjs
node tests/run-review-browser.mjs --desktop
```

Node.js 내장 WebSocket을 사용하며, Chrome 기본 경로는 `C:/Program Files/Google/Chrome/Application/chrome.exe`다. 다른 위치라면 `CHROME_PATH` 환경변수를 지정한다. 검증 중 Axios는 테스트 페이지 안에서만 모의 응답을 사용하므로 실제 DB에 후기 쓰기 요청을 보내지 않는다. 테스트 페이지는 제품 빌드의 진입점에 포함되지 않는다.

## E. 기존 기능 영향

- 새 사이드바 메뉴나 제품 라우트를 추가하지 않았다. GuardianApp에서는 기존 records 라우트에 props와 key만 추가했다.
- 로그인·회원가입·JWT 쿠키 처리 및 관리자 화면은 수정하지 않았다.
- 기존 방문기록 완료 표시 및 최신순, 요양보호사 완료 근무 조회·날짜/텍스트 필터·새로고침을 유지했다. 모의 브라우저에서 관련 동작을 확인했다.
- 실제 관리자 화면과 로그인/회원가입의 전체 동작은 이번에 로그인 계정으로 재검증하지 않았다.
- 새로운 외부 패키지 설치, Git 커밋·푸시·병합을 하지 않았다.
- 작업 전부터 존재한 `public/I'm a robber.png` 변경은 그대로 두었다.

## F. 남은 검증과 백엔드 검토 사항

실제 로그인 계정으로 DB 저장·수정·삭제, 로그아웃 후 다른 계정 재로그인, 다른 보호자/요양보호사의 권한 분리, 관리자 전체 기능은 미검증이다. 실제 확인 절차:

1. 백엔드 8080과 프론트 5173을 실행하고 실제 보호자로 로그인한다.
2. 방문 기록에서 수급자를 바꿔 본인 기록만 보이는지 확인한다. 실제 완료 근무 한 건을 선택한다.
3. 평점을 선택하지 않으면 등록이 막히는지 확인하고, 9점·내용 없음으로 등록한다. 개발자 도구 Network에서 POST의 `rating: 9`, `reviewContent: ""`와 응답 `true`, 이어지는 목록 GET을 확인한다.
4. 화면 새로고침 후에도 후기가 있는지 확인한다. 내용을 입력해 수정한 뒤 다시 모두 지워 수정하고 PUT의 빈 문자열과 실제 재조회 결과를 확인한다.
5. 삭제 확인을 취소해 요청이 없는지 확인한다. 확인해 삭제한 뒤 DELETE 본문·응답과 작성 버튼 복귀를 확인한다.
6. 로그아웃하고 해당 근무의 실제 요양보호사로 로그인한다. 후기 있는 근무와 없는 근무, 별점·내용·작성일 및 수정/삭제 버튼 부재를 확인한다. 다른 계정에도 이전 후기가 남지 않는지 확인한다.
7. 날짜·검색·새로고침, 기존 관리자 화면을 실제 계정으로 확인한다.

**별도 백엔드 보안 검토:** 현재 `oncare_backend/service/CareworkerReviewService.java`의 `createReview()`는 로그인 보호자 존재·근무 완료·중복·평점 범위를 검사하지만, 그 근무의 수급자가 로그인 보호자에게 연결되어 있는지 검사하지 않는다. 프론트에서 본인 수급자의 기록만 표시해도 직접 API 호출을 통한 타인 근무 등록을 서버에서 차단한 것은 아니다.

제안하는 최소 후속 변경은 후기 저장 전에 `CareworkerReportEntity → RequestEntity → CareRecipientEntity → GuardianEntity` 관계의 보호자 번호와 로그인 보호자 번호를 비교하고, 관계 누락/불일치면 false로 반환하는 것이다. 올바른 본인 근무 등록은 유지되고 타인 근무 등록만 거부되어야 한다. 해당 서비스 메소드의 검사 추가로 처리 가능하며 새 API/DB 변경은 필요하지 않을 것으로 보인다. **이번 작업에서는 변경하지 않았다.** 승인 없이 가능한 대안은 현재처럼 본인 수급자 기록만 프론트에 노출하는 것이며 서버 검증을 대신하지 못한다.

백엔드는 인증 쿠키가 없을 때도 목록에 `[]`를 반환한다. 따라서 실제 로그인·권한 검증은 정상 계정으로 별도 확인해야 한다.

## G. 변경 금지 범위 확인

- Java 백엔드 변경: 없음 (API 계약 확인을 위한 읽기만 수행).
- DB 스키마 및 SQL 변경: 없음.
- 기존 인증 로직 변경: 없음.
