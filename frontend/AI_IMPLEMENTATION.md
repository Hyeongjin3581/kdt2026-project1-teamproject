# Gemini AI 프론트엔드 연동

## 변경 파일

- `src/App.jsx`: 기존 로그인 사용자 정보를 Dashboard와 Inquiries에 props로 전달한다. 로그인 요청과 인증 방식은 기존 코드 그대로 사용한다.
- `src/features/admin/dashboard/Dashboard.jsx`: 기존 운영 현황을 유지하며 시스템 관리자(4)의 후기 요약과 서비스 후기 이동 버튼을 최상단에 표시한다.
- `src/features/admin/AdminApp.jsx`: 시스템 관리자(4)에게 서비스 후기 메뉴를 제공한다. 모바일 메뉴는 가로 스크롤로 모든 메뉴에 접근할 수 있다.
- `src/features/admin/reviews/ServiceReviews.jsx`: `/admin/reviews`에서 실제 관리자 후기 목록 API를 조회한다. 원문·평점·보호자·요양보호사·감정·분석 상태를 표시하고 검색·필터·상세·행별 분석을 제공한다.
- `src/components/common/SectionTitle.jsx`: allCenters 옵션으로 서비스 후기 페이지의 제목 배지를 전체 센터로 고정한다. 다른 화면은 기존 센터 선택 표시를 유지한다.
- `src/features/admin/inquiries/Inquiries.jsx`: 시스템 관리자(4)의 FAQ 관리 패널을 문의 목록 위에 배치하고, 저장된 답변의 `[AI 안내]` 접두사를 표시한다. 기존 응답 상태 판단·수정·삭제·일정 처리 코드는 유지한다.
- `src/features/guardian/request/GuardianRequest.jsx`: 기존 AI 문의 도우미를 재사용하며 등록 후 문의 내역만 갱신한다. 공통 FAQ는 별도로 접을 수 있다. 내역 갱신 실패 시 입력과 AI 답변을 유지하고 다시 조회할 수 있다.
- `src/features/guardian/request/AiInquiryAssistant.jsx`: 기존 유형별 질문 초안·답변 등록 API 연결을 보완한다. 응답 구조·유형 번호·저장 상태를 확인하고, 요청 중 변경·중복 제출을 막는다.

## 새 파일

- `src/features/admin/dashboard/AiReviewStats.jsx`: 대시보드용 compact 요약과 서비스 후기 페이지용 전체 감정 통계·최대 10건 수동 분석. 후기 번호 직접 입력은 제거했다.
- `src/features/admin/inquiries/AiFaqManagement.jsx`: 답변 완료 문의 선택, FAQ 초안 생성, 질문·답변 수정, 승인·승인 해제.
- `src/features/guardian/request/AiFaq.jsx`: 승인된 질문 목록 및 저장된 답변 조회, 접기·펼치기, 재시도.
- `src/utils/aiError.js`: AI 영역의 400·401·403·404·502·기타 서버 오류·통신 실패·잘못된 응답 안내.
- `tests/ai.html`, `tests/ai-browser.jsx`, `tests/run-ai-browser.mjs`: 개발 서버에서만 사용하는 모의 API 브라우저 검증. 제품 빌드에는 포함하지 않는다.
- `tests/service-reviews.html`, `tests/service-reviews-browser.jsx`, `tests/run-service-reviews-browser.mjs`: 서비스 후기 목록·검색·상세·분석·오류·반응형 전용 검증.
- `AI_IMPLEMENTATION.md`: 구현 내용과 검증 범위.

## 화면 및 데이터 흐름

시스템 관리자 대시보드는 로그인한 `user.userCategoryNo === 4`일 때만 AI 통계를 조회한다. 센터 선택 필터를 통계 요청에 전달하지 않으며, 패널에 전체 센터 기준임을 표시한다. 건수와 비율은 서버 응답을 그대로 사용한다. 비율의 기준은 분석 완료 후기이다. 분석 버튼은 요청 중 비활성화하고 ref로 중복 실행도 막는다. 한 번 클릭할 때 분석 API를 한 번 호출한 뒤 통계를 갱신하며, 남은 대기는 사용자가 다시 클릭해 처리한다.

대시보드는 전체·분석 대기·부정·매우 부정 건수를 요약하며, 상세 분포와 분석 버튼은 서비스 후기 페이지에 있다. 관리자가 후기 번호를 직접 알아야 하는 입력 방식은 제거했다. GET /api/ai/reviews의 실제 응답을 최신 작성순 그대로 표시한다. 검색은 원문·보호자·요양보호사 이름을 대상으로 하며, 감정 및 분석 상태 필터와 함께 프론트 배열에 적용한다.

분석 완료 후기는 저장된 감정을 표시하고, pending은 분석 대기, noText는 내용 없음으로 표시한다. 감정을 평점에서 추정하지 않는다. 기존 ReviewRating과 ReviewDialog를 재사용하여 원문 전체·평점·날짜·현재 감정을 확인한다. pending 후기의 행 또는 상세 창에서 분석 버튼을 누르면 해당 reviewNo를 단건 API에 전달한다. 내용 없는 후기는 분석 버튼을 제공하지 않고, 이미 분석된 후기를 조회만으로 다시 분석하지 않는다.

단건 및 묶음 분석은 공유 ref로 동시에 실행되지 않도록 막는다. 분석 뒤 목록과 통계를 갱신하고, 검색·필터 및 열린 상세의 선택은 유지한다. 필터 대상에서 제외된 행은 목록에서 사라지지만 열린 상세에는 최신 결과가 표시된다. 400/403/404/502·통신 실패·잘못된 응답을 성공이나 빈 목록으로 숨기지 않는다. 화면 이동 시 조회 요청을 취소하고 늦은 분석 응답으로 화면을 다시 조회하지 않는다.

시스템 관리자 문의 화면은 내용과 관리자 답변이 모두 있는 문의만 FAQ 생성 대상으로 보여준다. FAQ 초안을 생성하면 미승인 상태로 표시한다. 기존 FAQ 재생성 시 기존 내용 갱신·승인 해제를 안내하고 확인을 받는다. 질문과 답변 저장에는 `question`, `answer`를 사용하며, 백엔드 제한에 맞춰 질문 500자·답변 1,000자를 확인한다. 저장과 승인 응답은 `response.data === true`인 경우에만 성공으로 처리하고 목록을 다시 조회한다. 질문·답변을 수정한 상태에서는 저장 후 승인할 수 있다. 개인정보·개인 일정·개별 승인 결과에 대한 검토 안내와 승인 확인을 제공한다.

보호자 AI 문의 도우미는 기존 `/inquirycategory` 응답으로 유형을 만든다. 유형별 질문 초안을 조회하면 버튼으로 질문을 선택·편집하거나 직접 입력할 수 있다. 초안 조회는 저장 요청이 아니다. 질문 1~1,000자를 확인하고 실제 등록임을 안내한 뒤 답변 API에 유형 번호·질문·선택한 본인 방문의 requestNo만 보낸다. 일반 안내 문의는 requestNo=null로 등록할 수 있다. guardianNo/userNo는 보내지 않는다. 서버 응답의 문의 번호·유형·답변·needsStaff·status를 확인하며 프론트에서 응답 완료를 임의로 만들지 않는다.

등록 후 질문·답변 패널과 inquiryNo를 유지하고 같은 입력의 재제출을 막는다. 부모는 문의 목록만 다시 조회하여 내역을 갱신한다. 갱신 실패도 부모 화면의 전체 오류 상태로 바꾸지 않으므로 방금 받은 답변이 사라지지 않는다. 유형 변경 시 초안·질문·답변을 초기화하며, 요청 중 유형·내용 변경을 막고 이전 화면의 초안 응답을 취소한다. DB 근거가 부족해 needsStaff=true인 경우 센터 응답 대기를 정상 저장 상태로 표시한다. 일정 변경은 기존 희망 날짜·시간 입력 위치로 안내하며 AI 답변으로 실제 일정이나 배정을 변경하지 않는다.

보호자 공통 FAQ는 도우미와 구분된 접기 영역이다. 서버가 반환한 승인 질문만 표시한다. 질문 클릭 시 해당 답변 GET만 호출한다. 다시 접거나 다른 질문을 선택하면 이전 답변 요청을 취소하여 늦은 응답이 섞이지 않도록 한다. 404이면 이전 답변을 제거하고 저장된 답변을 확인할 수 없다고 안내한다. 재시도와 목록 새로고침을 제공한다. FAQ 조회는 문의를 등록하거나 변경하지 않는다. FAQ가 0건이어도 AI 문의 도우미는 사용할 수 있다.

센터 관리자(3)에게 AI 통계·FAQ 관리 컴포넌트를 렌더링하지 않는다. 요양보호사(2)는 기존 역할 라우팅을 따른다. 프론트의 표시 제어와 별개로 API 권한은 백엔드가 쿠키를 검증한다.

## 연동 API

모든 요청은 axios의 `withCredentials: true`를 사용하며 Vite의 기존 `/api` 프록시를 거친다. 브라우저에서 Gemini를 직접 호출하지 않는다.

| 메서드 | 경로 | 전달값 |
| --- | --- | --- |
| GET | `/api/ai/reviews/stats` | 없음 |
| GET | `/api/ai/reviews` | 없음, 전체 센터 기준 |
| POST | `/api/ai/reviews/analyze-pending` | 빈 객체 |
| POST | `/api/ai/reviews/analyze` | query `reviewNo`, body `{}` |
| POST | `/api/ai/inquiries/drafts` | query `inquiryCategoryNo`, body `{}` |
| POST | `/api/ai/inquiries/answer` | body `inquiryCategoryNo`(문자열), `question`, `requestNo`(문자열 또는 null) |
| GET | `/api/ai/faq/admin` | 없음 |
| POST | `/api/ai/faq/generate` | query `inquiryNo`, body `{}` |
| PUT | `/api/ai/faq/{faqNo}` | body `question`, `answer` |
| PUT | `/api/ai/faq/{faqNo}/approve` | query `approved`, body `{}` |
| GET | `/api/ai/faq` | 없음 |
| GET | `/api/ai/faq/{faqNo}/answer` | 없음 |

## 확인 결과 (2026-10-14)

- `npm run build`: 성공. 기존과 동일한 500 kB 초과 번들 경고가 있다.
- `node tests/run-ai-browser.mjs`: 모바일 390px, 70개 검증 통과.
- `node tests/run-ai-browser.mjs --desktop`: PC 1440px, 70개 검증 통과.
- `node tests/run-review-browser.mjs`: 기존 보호자·요양보호사 후기 검증 52개 통과.
- `node tests/run-service-reviews-browser.mjs`: 모바일 390px, 42개 검증 통과.
- `node tests/run-service-reviews-browser.mjs --desktop`: PC 1440px, 42개 검증 통과.
- `git diff --check`: 통과.
- AI 검증 범위: 실제 App 라우트를 통한 역할별 표시, 센터 필터와 통계 분리, 중복 호출 차단, 초안 생성·재생성 취소, 수정·승인 boolean 응답 확인, 승인 해제 반영, 보호자 DB 답변 표시 흐름, 404·권한 오류·AI 실패·통신 실패, 0건·내용 없는 후기, 접힌 질문의 늦은 응답 무시, 모바일 화면 넘침.

추가 검증: 관리자 목록 API 표시, 서버 정렬·null 관계·평점·ISO 날짜, 검색·필터 유지, 원문 상세, pending/noText와 평점 구분, 행별 분석 번호 전달, 단건/묶음 간 중복 차단, 분석 후 목록·통계 갱신, 열린 상세 결과 갱신, false·다른 reviewNo 응답 거부, 목록/분석 오류와 빈 배열 구분, 페이지 이동 후 늦은 응답 차단, 모바일 표 스크롤·상세 창 범위.

브라우저 검증은 모의 API 기반이다. 실제 서버 데이터·인증·DB 저장의 성공을 의미하지 않는다. 백엔드 `AiController`와 `AiInquiryService` 등을 읽어 경로·역할·응답 형식과 저장 제한이 요청서와 일치함을 확인했다. 백엔드 소스와 SQL·DB는 수정하지 않았다.

인증 쿠키 없는 GET /api/ai/reviews는 백엔드 직접·Vite 프록시 모두 HTTP 403을 확인했다. 기존 문의 유형 조회 HTTP 200 및 통계/FAQ의 쿠키 없는 403도 확인했다. 사용자에게 받은 백엔드 작업 결과에는 실제 DB의 후기 2건(긍정·중립)과 JWT 역할 검사 성공이 포함되지만, 이번 프론트 작업에서 실제 계정 비밀번호 로그인과 쿠키 발급 흐름·인증된 목록 200·Gemini 분석 POST·DB 변경은 직접 검증하지 않았다. 실제 후기를 수정하거나 재분석하지 않았다. 현재 백엔드에 목록 API가 추가되어 프론트 연결에 필요한 추가 백엔드 수정은 없다.

## 직접 확인 방법

1. 기존 방식으로 MySQL과 Spring 백엔드를 8080에 실행한다.
2. 프론트에서 `npm run dev` 실행 후 `http://localhost:5173`에 접속한다. 이미 서버가 있으면 기존 서버를 사용한다.
3. 시스템 관리자(4)로 서비스 후기 메뉴를 연다. 서버의 후기 목록·감정·평점·작성일을 확인하고 검색·필터·원문 보기를 사용한다. 분석 대기 후기가 있으면 행별 또는 묶음 분석 후 목록·통계·열린 상세가 갱신되는지 확인한다. 이 분석 버튼은 실제 Gemini 호출과 분석 결과 저장을 수행한다. 문의 관리에서는 답변된 문의의 FAQ 초안을 검토·수정·승인한다.
4. 보호자(1)로 요청·문의에서 DB 유형 선택 → 질문 초안 조회 또는 직접 입력 → AI 답변 받기·문의 등록을 확인한다. 이 버튼은 실제 문의를 저장한다. 등록 번호·응답 상태·입력과 답변 유지·기존 문의 내역 갱신을 확인한다. 별도의 공통 FAQ를 펼쳐 승인 질문과 저장된 답변도 확인한다.
5. 관리자가 승인을 해제한 뒤 보호자 목록을 새로고침하여 질문이 제외되는지 확인한다. 이전 목록에서 질문을 클릭하면 답변 404 안내가 나와야 한다.
6. 센터 관리자(3)로 AI 영역이 숨겨지는지 확인한다. 기존 후기·문의·일정 기능도 실제 DB와 함께 확인한다.

모의 브라우저 검증은 Vite 실행 상태에서 위 Node 명령으로 다시 실행할 수 있다. 설치된 Chrome을 사용하며, 다른 위치라면 `CHROME_PATH` 환경변수로 경로를 지정한다.

## 확정된 후기 목록 계약

GET /api/ai/reviews는 배열을 반환한다. 각 항목의 12개 필드: reviewNo, careworkersReportNo, guardianName, careworkerNo, careworkerName, rating, reviewContent, createDate, updateDate, sentiment, analysisStatus, analyzedAt.

analysisStatus는 analyzed/pending/noText이다. pending/noText의 sentiment와 analyzedAt는 null이다. 서버가 현재 내용 hash를 비교하므로 프론트는 이 상태를 그대로 사용한다. 목록 조회 시에는 Gemini 호출이나 저장을 하지 않는다. 작성일·수정일·분석일은 null 또는 ISO 문자열이다. 평점은 DB의 1~10점을 그대로 표시한다.
