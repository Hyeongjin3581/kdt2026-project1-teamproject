# ONCARE Caregiver Portal — UI 완성과 API 연결 상태

프론트 UI와 사용자 흐름을 구현하고, 팀원 백엔드가 병합되면 API 모듈에 실제 요청을 연결하는 구조입니다. 이번 작업에서 백엔드 코드·DB·라이브러리를 변경하지 않았습니다. 관리자·보호자의 기존 화면 및 동작도 수정 범위에 포함하지 않았습니다.

## 최신 변경 — 1시간 드래그 자동 저장 흐름 (저장 규칙 확인 대기)

- 시간표는 하루 24칸, 한 칸 1시간입니다. 드래그 등록은 모달을 열지 않고 `saveSelection`을 호출합니다. 직접 입력 버튼과 기존 블록 수정/삭제는 유지합니다.
- 저장 진행 중에는 선택 구간과 진행 상태를 표시하고 중복 요청을 막습니다. POST가 boolean `true`이면 화면을 숨기지 않고 GET으로 서버 목록을 다시 조회하여 실제 `availabilityNo`가 있는 블록으로 교체합니다.
- `false`/요청 실패는 임시 선택을 해제하고 오류를 표시합니다. POST 성공 후 GET만 실패한 경우 저장 사실과 선택 구간을 유지하고 새로고침을 안내합니다. 이 임시 구간에 임의 PK를 붙이지 않습니다.
- **실제 자동 저장 활성화는 확인 대기 중입니다.** 현재 Controller/Service는 시간 Integer를 그대로 저장하며 단위와 기본 status 규칙이 없습니다. 사용자에게 `09:00~11:00 → startTime: 9, endTime: 11, status: "가능"` 규칙과 더미 계정의 세션 내 체험 반영 여부를 질문했습니다. 답변 전까지 변환 함수와 `defaultAvailabilityStatus`는 `null`이며 실제 전송은 차단합니다. 더미 데이터 쓰기 차단도 유지합니다.
- 수정: `AvailabilityWeekView.jsx`(1시간 간격·자동 저장 연결), `CaregiverAvailability.jsx`(저장·재조회·오류 상태), `availabilityTime.js`(기본 상태 확정 지점), `CaregiverApp.jsx`(가용시간의 화면 유지 재조회), 이 문서.
- 검증: `npm run build` 성공(기존 번들 크기 경고). 별도 임시 검증 페이지에만 시간 규칙과 API 응답을 주입하여 팝업 없음, 1시간 선택, 정확한 payload, 진행 중 잠금, 재조회 후 블록 유지, false/네트워크 오류, POST 성공·GET 실패 후 복구를 Edge에서 확인했습니다. 실제 DB 요청은 보내지 않았으며 임시 파일과 검증 서버는 제거했습니다.

## 이전 변경 — 시간표 드래그 후 모달 입력

기존 참고용 시간표를 마우스로 범위를 선택하는 입력 UI로 변경했습니다. 아래의 이전 작업 기록 중 상단 카드·참고 시간축 설명은 이 구현으로 대체됩니다. 백엔드, DB, 관리자/보호자 화면, API endpoint는 변경하지 않았습니다.

### 동작과 데이터 흐름

1. PC에서 날짜 컬럼을 누르면 시작 날짜·시각을 기억하고 `setPointerCapture`로 해당 컬럼에 선택을 고정합니다. 옆 날짜로 이동해도 날짜는 바뀌지 않습니다.
2. 이동 중 `clientY`와 컬럼 위치를 이용하여 UI 시각을 계산합니다. UI 내부 표현은 자정부터의 분(0~1440), 선택 간격은 30분입니다. 이는 서버 Integer의 저장 단위를 의미하지 않습니다. 역방향 드래그도 시작/종료 순서로 정리하며 최소 선택은 30분입니다.
3. 선택 범위는 반투명 블록으로 실시간 표시합니다. 가장자리에서는 자동 스크롤하고, Esc·포인터 취소·창 포커스 이탈 시 선택을 취소합니다.
4. 마우스를 놓으면 `CaregiverAvailability`가 `{ availableDate, startMinutes, endMinutes }`를 기존 `AvailabilityFormModal`에 전달합니다. 이 단계에서 API 요청은 없습니다. 모달을 취소하면 임시 블록도 사라집니다.
5. 날짜와 선택한 시각을 모달에 표시합니다. 변환 가능한 경우에만 저장용 정수 입력칸을 자동으로 채웁니다. 현재는 변환 규칙이 없으므로 정수칸은 비워 두고 기존 안전한 직접 입력을 사용합니다. 필수값·정수 범위·시작/종료·본인 번호 검증 후 사용자가 저장할 때 기존 POST/PUT을 호출합니다.
6. `＋ 가용시간 등록`은 기존 직접 입력 방식입니다. 모바일은 드래그를 강제하지 않으며 터치 스크롤·등록 버튼·수정/삭제 가능한 목록을 제공합니다.

### 시간 변환과 블록 표시

- 새 `availability/availabilityTime.js`의 `uiTimeToBackendValue(minutes)`와 `backendValueToUiTime(value)`가 UI/API 변환 지점입니다. 현재 두 함수는 `null`을 반환합니다. 서버 시간 규칙이 합의되면 이 두 함수를 구현합니다. `0`과 변환 불가(`null`)는 구분합니다.
- 유효한 UI 범위로 변환된 가용시간은 해당 날짜 컬럼에서 `시작 분 / 1440` 위치와 `(종료 분 - 시작 분) / 1440` 높이의 청록색 블록으로 표시합니다. 클릭은 기존 수정 모달을 열고, 삭제는 실제 `availabilityNo`와 기존 확인 절차를 유지합니다. 겹치는 블록은 나란히 표시합니다.
- **현재 실제 서버 정수값의 시간축 자동 배치는 제한됩니다.** 단위를 추정하지 않으므로 변환할 수 없는 데이터는 시간표 아래의 “시간 배치를 확인할 가용시간” 목록에 원값으로 표시합니다. 기존 조회·수정·삭제가 가능합니다. 이것을 임의의 시각 블록으로 표시하거나 변환값을 DB로 전송하지 않습니다.
- `confirmedWork`에는 향후 `{ scheduleNo, visitDate, startMinutes, endMinutes, status }` 형태의 표시용 배열을 전달할 수 있습니다. 회색 블록은 읽기 전용이고 수정/삭제/드래그 이동이 없습니다. 현재 기본값은 빈 배열이며 확정 근무 예시 데이터를 추가하거나 요청 API를 호출하지 않습니다.
- `timeAdapter` prop의 기본값은 위 변환 함수입니다. 브라우저 검증에서만 별도 규칙을 주입하여 실제 배치와 모달 자동 입력을 확인했습니다. 운영 앱에 검증용 변환 규칙을 넣지 않았습니다.

### 이번 변경 파일

| 구분 | 파일 | 역할 |
| --- | --- | --- |
| 생성 | `src/features/caregiver/availability/availabilityTime.js` | UI/API 시간 변환 지점, UI 범위 검사·시각 표시 |
| 수정 | `src/features/caregiver/availability/AvailabilityWeekView.jsx` | 드래그·강조·자동 스크롤·시간축 블록·읽기 전용 근무·모바일 목록 |
| 수정 | `src/features/caregiver/availability/CaregiverAvailability.jsx` | 선택 상태와 변환 함수를 시간표/기존 모달에 전달 |
| 수정 | `src/features/caregiver/availability/AvailabilityFormModal.jsx` | 선택 날짜·시각 표시, 변환 가능 시 정수칸 자동 입력 |
| 수정 | `CAREGIVER_PORTAL.md` | 최신 흐름·시간 단위 제한·검증 기록 |

`caregiverApi.js`, `CaregiverApp`의 본인 필터, 기존 삭제 처리·boolean 성공 검사·모달 validation은 변경하지 않았습니다.

### 검증

- `npm run build` 성공. 기존 500 kB 초과 번들 경고가 있습니다.
- Edge 실제 마우스 이벤트로 09:00~11:00 선택, 다른 날짜로 가로 이동해도 초기 날짜 유지, 역방향 선택, Esc 취소, 가장자리 자동 스크롤, 23:30~24:00 경계를 확인했습니다.
- 드래그만으로 저장하지 않는 것, 모달 날짜/선택 시각 전달, 미확정 변환값 제출 차단, 모달 취소 후 임시 블록 제거를 확인했습니다.
- 기존 API 모듈에 임시 axios 응답을 주입하여 GET 본인 필터, 정수 POST, 실제 PK PUT/DELETE, 삭제 취소, `false` 응답 실패 처리를 확인했습니다. 검증용 변환 함수로 블록의 위치/높이·겹침 배치·클릭 수정·확정 근무 읽기 전용도 확인했습니다.
- 390px 화면에서 내부 가로 스크롤, 가용시간 카드, 터치로 드래그 선택하지 않는 동작을 확인했습니다. 브라우저 예외 0건, 실제 백엔드 HTTP 요청 0건입니다. 임시 검증 파일과 서버는 제거했습니다. 실제 DB 통합 검증은 하지 않았습니다.

직접 확인: 개발 서버 → 요양보호사 더미 로그인 → 가용시간 → PC에서 같은 날짜의 09:00~11:00 드래그 → 선택 영역과 모달의 날짜/시각 확인 → 취소 → 기존 데이터 목록의 수정/삭제 확인. 더미 모드의 저장·삭제 차단은 그대로 유지됩니다.

## 이전 변경 — 주간 보기와 일정 요청 UI

- 가용시간을 월~일 주간 화면으로 변경했습니다. 기준 날짜·이전/다음 주·오늘 이동, 날짜별 등록 블록, 모바일 내부 스크롤을 지원합니다. 블록 클릭은 기존 `AvailabilityFormModal`을 열고, 삭제는 기존 확인 모달과 API를 사용합니다. 저장·삭제 후 재조회에서도 보고 있던 주를 유지합니다.
- 시간 단위가 미정이므로 블록을 날짜별 상단의 **시간 배치 전** 영역에 표시합니다. `startTime`/`endTime`은 정수 원값이며 시/분으로 변환하지 않습니다. 하단 00:00~24:00 참고 시간축에는 블록을 배치하지 않습니다. 단위가 합의된 이후에만 실제 위치·높이 계산을 추가해야 합니다.
- 확정 근무 일정은 읽기 전용입니다. 취소 요청 버튼으로 일정 확인·사유 입력·필수값 검사·미저장 닫기 확인을 할 수 있으나, 요청 전송은 비활성화되어 있습니다. 취소 API 요청이나 성공 처리, 일정 상태 변경은 없습니다. 벌점·재등록 금지 정책은 구현하지 않았습니다.
- 홈에 일정 변경 알림 영역을 추가했습니다. 실제 배열을 표시하는 구조와 빈 상태·로딩·오류·재시도를 갖추었으며, 더미 계정에서도 알림을 생성하지 않습니다. 알림을 표시하는 것만으로 확정 일정을 변경하지 않습니다.
- 가입의 실제 성공 응답(`response.data === true`)에서만 관리자 승인 안내 모달이 열립니다. 현재 `signup: null`이므로 앱에서 가입 성공 모달을 임의로 띄우지 않습니다. 승인 전 로그인 응답은 “센터 승인 대기 중인 계정입니다.”를 표시합니다.
- 일정 변경 원칙은 **보호자/요양보호사 요청 → 센터 관리자 확인 → 일정 확정**입니다. 실제 요청 전달·알림 발송·관리자 처리의 서버 연동은 아직 없습니다.

### 이번 추가 작업 파일

| 구분 | 파일 (`src/features/` 기준) | 변경 내용 |
| --- | --- | --- |
| 생성 | `caregiver/availability/AvailabilityWeekView.jsx` | 주간 이동, 날짜별 블록, 참고 시간축, 모바일 스크롤 |
| 생성 | `caregiver/schedule/ScheduleCancelRequestModal.jsx` | 읽기 전용 일정·취소 사유·입력 검증·닫기 확인, 전송 차단 |
| 생성 | `caregiver/schedule/ScheduleChangeNotifications.jsx` | 배열 기반 일정 변경 알림·로딩·오류·빈 상태 |
| 생성 | `auth/CaregiverApprovalModal.jsx` | 실제 가입 성공 후 승인 대기 안내 |
| 수정 | `caregiver/availability/CaregiverAvailability.jsx` | 기존 CRUD를 유지하고 목록을 주간 보기로 교체 |
| 수정 | `caregiver/schedule/CaregiverSchedule.jsx` | 확정 근무 안내와 데스크톱/모바일 취소 요청 진입 |
| 수정 | `caregiver/home/CaregiverHome.jsx` | 홈 알림 영역 연결 |
| 수정 | `caregiver/CaregiverApp.jsx` | 알림 조회 함수 연결 여부에 따른 상태·데이터 전달 |
| 수정 | `caregiver/caregiverApi.js` | `getNotifications: null` 연결 자리 추가, endpoint 추가 없음 |
| 수정 | `auth/CaregiverSignupForm.jsx` | 기존 실제 성공 분기에서 승인 안내 모달 표시 |
| 수정 | `auth/CaregiverLoginForm.jsx` | 승인 대기 문구 명확화 |
| 수정 | 루트 `CAREGIVER_PORTAL.md` | 변경 범위·연결 대기 항목·검증 결과 정리 |

기존 Profile, Records, AvailabilityFormModal, navigation, 개발용 더미 데이터와 관리자/보호자 파일은 이번 추가 작업에서 수정하지 않았습니다.

### 추가 작업 검증 및 확인 방법

- `npm run build` 성공. 기존 500 kB 초과 번들 경고는 남아 있습니다.
- Edge headless로 연말/연초 월~일 경계, 다음 주 빈 상태, 정수 최댓값 표시, 등록/수정/삭제 전달값, 삭제 취소, 재조회 후 주 유지, 390px 내부 스크롤을 확인했습니다.
- 취소 요청 사유 검증·전송 차단·미저장 닫기 확인, 알림 배열/빈 상태/로딩/오류, 가입 미연결·실패 응답에서 성공 모달 차단, 성공 응답의 승인 모달, 승인 대기 로그인 차단을 확인했습니다.
- 실제 앱에서 더미 로그인 후 홈 알림 빈 상태와 가용시간 주간 화면을 확인했습니다. 브라우저 예외와 백엔드 HTTP 요청은 모두 0건입니다. 검증용 응답은 별도 임시 파일에만 주입했고, 검증 후 파일과 서버를 제거했습니다. 실제 DB 연동 검증은 하지 않았습니다.
- 직접 확인: `npm run dev` → 요양보호사 → 더미 계정으로 둘러보기 → 가용시간에서 날짜/주 이동·블록 클릭 → 방문 일정에서 근무 취소 요청 → 홈에서 알림 빈 상태 확인. 더미 모드의 저장·삭제·요청 전송은 차단됩니다.
- 가입 모달은 실제 가입 API 연결 후 성공 응답으로 확인합니다. 승인되지 않은 계정이 포털에 진입하지 않는지도 함께 확인해야 합니다.

### 추가 API 연결 대기

- `getNotifications(careworkerNo)`는 현재 `null`입니다. 백엔드 병합 후 확인한 실제 경로를 사용하고, `response.data`를 `[{ notificationNo, recipientName, message, originalDate, originalTime, requestedDate, requestedTime, status }]` 형태의 **프론트 표시용 배열**로 변환합니다. 날짜/시간은 표시용 문자열이며, 취소 알림은 `message`로 설명하고 변경 시간이 없으면 생략할 수 있습니다. 이 규약은 백엔드 DTO를 임의로 확정한 것이 아닙니다.
- 취소 요청은 `ScheduleCancelRequestModal.jsx`에 입력 상태만 존재합니다. API 병합 후 서버가 요구하는 요청 필드·권한·응답을 확인하여 `caregiverApi.js`에 실제 함수를 연결하고 전송·대기·오류 처리를 추가해야 합니다. 현재 버튼의 비활성화만 해제해서는 동작하지 않습니다.
- 실제 시간 배치에는 가용시간 정수 단위 합의가 필요합니다. 알림 수신 방식(조회/실시간), 센터 관리자 처리·확정 결과 반영도 서버 계약 후 연결해야 합니다.

## 현재 동작

- 로그인·회원가입: 요양보호사 전용 입력, 필수값 검사, 비밀번호 확인, 주소 검색, 소속 센터 선택 영역, 승인 절차 안내가 있습니다. 실제 인증·가입 함수가 연결되기 전에는 일반 계정 제출이 차단됩니다. 개발 서버에서는 아래 더미 계정으로 화면을 확인할 수 있습니다.
- 홈: 근무·승인 상태, 소속 센터, 오늘·다가오는 일정, 가용시간, 바로가기를 표시합니다. 데이터가 없는 영역은 정상적인 빈 상태이며 연결 대기 안내를 보조 문구로 표시합니다.
- 일정: 날짜 필터·초기화, 날짜/시작·종료/수급자/주소/상태를 표시하는 데스크톱 표와 모바일 카드, 빈 상태·로딩·오류·재시도가 있습니다.
- 기록: 날짜·검색 필터, 업무 내용·특이사항·작성 상태 목록, 작성·상세·수정 모달이 있습니다. 필수값 검사, 저장 중 상태, 실패 메시지, 작성 중 닫기 확인을 지원합니다. 서버 미연결 상태에서도 입력과 검증은 가능하지만 저장은 차단됩니다.
- 프로필: 기존 이름·주소 저장을 유지합니다. 연락처 입력, 현재·새 비밀번호·비밀번호 확인, 탈퇴 확인 모달을 구현했습니다. 탈퇴는 현재 비밀번호와 `탈퇴합니다` 문구 확인을 거칩니다. 계정 API가 연결되기 전에는 입력 확인만 가능하며 실제 변경 요청은 없습니다.
- 가용시간: 기존 실제 CRUD를 유지합니다. 정수 시간값, 본인 번호 필터, 실제 PK 수정·삭제, 삭제 확인, 서버 boolean 응답 검사를 유지합니다.
- 반응형: caregiver 사이드바·헤더·하단 5개 메뉴를 유지하고, 모바일에서는 일정·기록을 카드로 표시합니다. 앱의 미리보기 버튼은 caregiver 모바일 메뉴 위에 배치합니다.

운영 빌드에는 더미 계정과 예시 데이터가 포함되지 않습니다. 첫 번째 careworker를 본인으로 취급하지 않으며, 로그인하지 않고 `/caregiver` 하위 주소에 직접 접근하면 로그인 화면으로 돌아갑니다.

## 개발 서버에서 더미 계정으로 확인하기

사용자의 추가 요청에 따라 백엔드 연결 전 화면 확인용 더미 계정을 추가했습니다. DB에 등록한 계정이 아니며 `npm run dev` 개발 서버에서만 사용할 수 있습니다.

- 아이디: `caregiver_demo`
- 비밀번호: `oncare1234`
- 가장 빠른 진입: 로그인 화면 → 요양보호사 선택 → **더미 계정으로 둘러보기**
- 직접 입력: 위 아이디·비밀번호 입력 → **더미 계정 로그인**

더미 홈, 체험 센터, 오늘·내일 일정, 업무 기록, 가용시간과 개인 정보를 볼 수 있습니다. 날짜는 로그인 시점에 맞춰 생성됩니다. 표시되는 근무·승인·방문 상태도 실제 서버 상태가 아닌 예시입니다.

상단에 더미 모드 안내를 표시하고 실제 저장·삭제는 차단합니다. 등록·수정·탈퇴 등의 입력 화면과 확인 모달은 열어볼 수 있습니다. 더미 데이터 API 객체만 해당 로그인 세션의 컴포넌트 props로 전달하며 기존 실제 `caregiverApi.js`를 교체하거나 변경하지 않습니다. 더미 API의 변경 함수도 요청 없이 실패하도록 막았습니다.

로그아웃 또는 새로고침하면 더미 세션이 종료됩니다. `npm run build` 결과와 `npm run preview`에는 더미 로그인 버튼·계정·데이터가 포함되지 않습니다. 배포용 로그인은 기존 승인 확인 흐름을 따릅니다.

## 기존 포털 구현 파일

| 구분 | 파일 | 역할 |
| --- | --- | --- |
| 생성 | `src/features/caregiver/caregiverApi.js` | 확인된 API 요청과 향후 연결 함수의 위치 |
| 생성 | `src/features/caregiver/caregiverDemo.js` | 개발 서버 전용 더미 계정·조회 데이터·쓰기 차단 |
| 생성 | `src/features/auth/CaregiverLoginForm.jsx` | 요양보호사 로그인 폼·승인/이용 제한 분기 |
| 생성 | `src/features/auth/CaregiverSignupForm.jsx` | 개인정보·센터·동의·입력 검증·승인 신청 흐름 |
| 생성 | `src/features/auth/CaregiverCenterSelect.jsx` | 실제 센터 배열 기반 옵션·로딩·오류·빈 상태 |
| 생성 | `src/features/caregiver/records/RecordFormModal.jsx` | 기록 작성/수정 폼·검증·미저장 내용 확인 |
| 수정 | `src/App.jsx` | 인증 응답의 승인·이용 상태 보관과 caregiver 라우트 보호 |
| 수정 | `src/features/auth/Login.jsx` | caregiver 전용 로그인 폼 분기 |
| 수정 | `src/features/auth/Signup.jsx` | caregiver 전용 가입 폼 분기 |
| 수정 | `src/features/auth/roleMeta.js` | 역할 설명 문구 |
| 수정 | `src/features/caregiver/CaregiverApp.jsx` | API 모듈 호출, 일정·기록·센터 데이터/로딩/오류 전달 |
| 수정 | `src/features/caregiver/home/CaregiverHome.jsx` | 센터 상세와 오늘·다가오는 일정 데이터 표시 |
| 수정 | `src/features/caregiver/schedule/CaregiverSchedule.jsx` | 날짜 필터와 반응형 일정 조회 화면 |
| 수정 | `src/features/caregiver/records/CaregiverRecords.jsx` | 목록·검색·작성/수정·재조회 흐름 |
| 수정 | `src/features/caregiver/profile/CaregiverProfile.jsx` | 연락처·비밀번호·탈퇴 폼 및 기존 개인정보 저장 |
| 수정 | `src/features/caregiver/availability/CaregiverAvailability.jsx` | 기존 삭제 요청을 API 모듈로 이동 |
| 수정 | `src/features/caregiver/availability/AvailabilityFormModal.jsx` | 기존 등록·수정 요청을 API 모듈로 이동 |
| 수정 | `CAREGIVER_PORTAL.md` | UI 범위, 연결 규약, 검증 내역 |

기존 `Panel`, `Badge`, `AppMark`, `AddressField`, `LoadStatus`와 Tailwind 스타일을 재사용합니다.

## 실제 API 연결이 유지된 항목

`caregiverApi.js`의 함수는 기존과 같이 axios 응답을 반환합니다. 상대 경로와 `withCredentials: true`를 사용합니다.

| 함수 | 요청 |
| --- | --- |
| `getProfile(careworkerNo)` | `GET /api/careworkers/detail?careworkerNo=번호` |
| `updateProfile(body)` | `PUT /api/careworkers` |
| `getAvailability()` | `GET /api/caregiver-availability` |
| `createAvailability(body)` | `POST /api/caregiver-availability` |
| `updateAvailability(body)` | `PUT /api/caregiver-availability` |
| `deleteAvailability(availabilityNo)` | `DELETE /api/caregiver-availability?availabilityNo=번호` |

개인 정보는 저장 직전에 상세 정보를 다시 조회하여 이름·주소만 바꿉니다. `careworkerNo`, 성별, 나이, 시급, 상태, 센터·계정 번호는 현재 서버 값을 유지합니다. 읽기 전용 UI는 서버의 권한 검사를 대신하지 않으며, 전체 DTO PUT의 동시 수정 제어는 기존 API 범위입니다.

가용시간의 `startTime`/`endTime`은 사용자 결정에 따라 정수값 그대로 입력·표시합니다. 시간 단위를 추정하지 않습니다. 시간은 0 이상의 정수이며 시작값보다 종료값이 커야 합니다. `status`는 임의 enum 없이 현재 문자열 형태를 유지합니다.

## 백엔드 병합 후 연결할 위치

현재 아래 함수는 `null`입니다. 화면은 이를 확인하여 요청을 생략하거나 실제 제출을 비활성화합니다. `null`은 성공 응답이나 mock 데이터를 반환하는 함수가 아닙니다.

아래 데이터 필드는 **프론트 컴포넌트의 입력 규약**입니다. 실제 서버 endpoint/DTO를 확정한 것이 아닙니다. 병합된 Controller를 확인한 뒤 `caregiverApi.js`에서 서버 요청·응답을 이 형태로 맞춥니다.

| 함수 | 입력 | 화면이 사용하는 `response.data` |
| --- | --- | --- |
| `login` | `{ userId, userPassword }` | `{ role, careworkerNo, approved, canUse }` |
| `signup` | `{ userId, userPassword, careworkerName, phoneNumber, careworkerAddress, centerNo }` | 접수 성공 여부 boolean |
| `getCenters` | 없음 | `[{ centerNo, centerName, address, phoneNumber }]` |
| `getSchedule` | `careworkerNo` | `[{ scheduleNo, visitDate, startTime, endTime, recipientName, address, status }]` |
| `getNotifications` | `careworkerNo` | `[{ notificationNo, recipientName, message, originalDate, originalTime, requestedDate, requestedTime, status }]` |
| `getRecords` | `careworkerNo` | `[{ recordNo, visitDate, recipientName, content, notes, status }]` |
| `saveRecord` | `{ careworkerNo, recordNo?, visitDate, recipientName, content, notes, status }` | 저장 성공 여부 boolean |
| `getAccount` | `careworkerNo` | `{ phoneNumber }` |
| `updatePhone` | `{ phoneNumber }` | 저장 성공 여부 boolean |
| `changePassword` | `{ currentPassword, newPassword }` | 변경 성공 여부 boolean |
| `withdraw` | `{ currentPassword }` | 탈퇴 성공 여부 boolean |

- 일정·기록 날짜는 화면에서 `YYYY-MM-DD`, 일정 시작/종료는 표시용 문자열로 받습니다. 가용시간의 정수 시간값과 별개입니다.
- 일정·기록 배열은 서버에서 로그인한 본인에게 허용된 데이터여야 합니다. UI에서 임의의 수급자 ID나 일정 ID를 만들어 전송하지 않습니다. 실제 기록 작성 API에 연결 ID가 필요하면 해당 조회·선택 필드를 서버 계약에 맞춰 연결합니다.
- 로그인은 `role === "caregiver"`, 양의 정수 `careworkerNo`, `approved === true`, `canUse !== false`인 응답만 App에 전달합니다. 실제 백엔드가 승인 상태 코드나 이용 가능 값만 반환하면 API 모듈에서 합의된 기준으로 매핑합니다. 근무 상태를 승인 여부로 추측하지 않습니다.
- App 콜백은 `login("caregiver", careworkerNo, { approved, canUse })`입니다. 서버 응답에서 확인한 값만 전달합니다.
- 폼의 저장 성공은 실제 함수가 반환한 `response.data === true`일 때만 표시합니다. 서버가 다른 성공 형식을 쓰면 API 모듈에서 명시적으로 변환합니다. 오류 응답은 그대로 실패로 처리해야 합니다.
- 센터 옵션은 전달된 배열만 사용하며 가짜 센터를 보완하지 않습니다. 기본 선택도 사용자가 직접 합니다.
- 로그인 상태는 기존 앱처럼 메모리에 유지되므로 새로고침 후 세션 복원은 로그인/본인 조회 API 계약에 맞춰 후속 연결이 필요합니다.

## 검증 결과

- `npm run build` 성공. Vite의 500 kB 초과 번들 경고가 있으며 빌드 오류는 없습니다.
- 설치된 Edge headless 브라우저에서 12개 묶음의 검증을 통과했습니다: 로그인/가입 UI·검증, 5개 경로 보호, 인증 응답의 승인/이용 제한/역할 분기, 일정 데이터/필터/로딩/오류, 홈과 미연결 API 요청 차단, 계정 입력/탈퇴 확인, 기존 개인정보 저장, 기존 가용시간 CRUD, 기록 입력/미저장 닫기, 기록 데이터/수정/응답 처리, 390px 모바일 화면, 미리보기 버튼과 하단 메뉴 간격.
- 기존 UI 검증용 데이터와 API 응답은 별도 임시 브라우저 검증 모듈에서 주입했으며 검증 서버와 스크립트는 종료·제거했습니다. 이후 사용자 요청으로 추가한 개발용 더미 계정은 `caregiverDemo.js`에 분리했습니다.
- 더미 계정 추가 후 빌드와 실제 브라우저 검증을 다시 완료했습니다. 아이디/비밀번호 검사, 5개 화면 이동, 저장·삭제 차단, 모바일 화면, 로그아웃/새로고침 종료, 운영 빌드에서 더미 로그인 제외를 확인했습니다. 더미 모드의 백엔드 API 요청은 0건이었습니다.
- 실제 백엔드와 DB에는 요청을 보내거나 데이터를 쓰지 않았습니다. 위 브라우저 결과는 프론트 상태·요청 구성에 대한 검증이며, 팀원 API 병합 후 실제 서버 통합 검증이 필요합니다.

## 직접 확인 순서

1. `npm run build`로 빌드하고 `npm run dev`로 화면을 엽니다. 이미 서버가 실행 중이면 기존 주소를 이용합니다.
2. 개발 서버에서 요양보호사 선택 → 더미 계정으로 둘러보기로 진입합니다. 일반 계정은 API 연결 전까지 제출이 차단됩니다.
3. 회원가입 이동 → 개인정보·비밀번호 확인·주소·센터 선택 영역·승인 절차를 확인합니다. `입력 내용 확인`으로 validation을 확인합니다. 미연결 상태에서 가입 성공 화면으로 넘어가면 안 됩니다.
4. `/caregiver` 및 하위 주소 직접 접근이 로그인 화면으로 돌아가는지 확인합니다. 임의 로그인용 우회 경로는 없습니다.
5. API 병합 후 위 API 모듈을 연결하고 승인된 테스트 계정으로 로그인합니다. 홈의 이름/센터/승인 상태와 일정·가용시간이 실제 응답과 일치하는지 확인합니다.
6. 일정 날짜 필터 → 기록 작성/수정 및 닫기 확인 → 이름·주소 저장 → 연락처·비밀번호·탈퇴 확인 순서로 검사합니다. 미연결 항목은 입력해도 서버 저장 성공 메시지가 나오면 안 됩니다.
7. 가용시간 등록 → 수정 → 삭제 취소 → 삭제 확인을 진행합니다. 실제 `caregiverNo`, `availabilityNo`와 숫자형 시간값을 개발자 도구에서 확인합니다.
8. 390px 정도의 모바일 화면에서 하단 메뉴, 카드 목록, 폼 모달, 로그아웃을 확인합니다.
