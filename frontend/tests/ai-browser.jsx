// 개발 서버 전용 모의 API 검증. 실제 인증이나 DB 저장 성공을 증명하지 않는다.
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import App from "../src/App";
import AiReviewStats from "../src/features/admin/dashboard/AiReviewStats";
import AiFaqManagement from "../src/features/admin/inquiries/AiFaqManagement";
import AiFaq from "../src/features/guardian/request/AiFaq";
import AiInquiryAssistant from "../src/features/guardian/request/AiInquiryAssistant";
import "../src/index.css";

const root = createRoot(document.getElementById("root"));
const passed = [];
const calls = [];
const inquiries = [
  { inquiryNo: 11, guardianNo: 7, inquiryCategoryNo: 2, inquiryContent: "기록 조회 문의", answerContent: "방문 기록 메뉴에서 확인하세요." },
  { inquiryNo: 12, guardianNo: 7, inquiryCategoryNo: 2, inquiryContent: "미응답 문의", answerContent: "" },
  { inquiryNo: 13, guardianNo: 7, inquiryCategoryNo: 2, inquiryContent: " ", answerContent: "내용 없는 문의" },
];
const categories = [
  { inquiryCategoryNo: 1, inquiryCategoryName: "방문 시간 변경 요청" },
  { inquiryCategoryNo: 3, inquiryCategoryName: "담당자 관련 문의" },
  { inquiryCategoryNo: 4, inquiryCategoryName: "기타 문의" },
];
const names = ["매우 긍정", "긍정", "중립", "부정", "매우 부정"];
const zeroes = Object.fromEntries(names.map((name) => [name, 0]));
let stats = { total: 6, analyzed: 2, pending: 3, noText: 1, counts: { ...zeroes, "긍정": 2 }, percentages: { ...zeroes, "긍정": 100 } };
let faqs = [];
let category = 4;
let failure = null;
let mutationResult = true;
let hold = "";
let release = null;
let confirmResult = true;
let confirmations = [];
let needsStaff = false;
let invalidDraft = false;
let invalidAnswer = false;
let refreshFails = false;
let reviewItems = [1, 2, 3, 4, 5, 6].map((reviewNo) => ({
  reviewNo, careworkersReportNo: reviewNo + 100, guardianName: "검증 보호자", careworkerNo: 5, careworkerName: "검증 요양보호사",
  rating: 8, reviewContent: reviewNo === 3 ? null : `검증 후기 ${reviewNo}`, createDate: "2026-10-14T10:00:00", updateDate: null,
  analysisStatus: [1, 4].includes(reviewNo) ? "analyzed" : reviewNo === 3 ? "noText" : "pending",
  sentiment: [1, 4].includes(reviewNo) ? "긍정" : null, analyzedAt: [1, 4].includes(reviewNo) ? "2026-10-14T11:00:00" : null,
}));
window.confirm = (message) => { confirmations.push(message); return confirmResult; };

axios.defaults.adapter = async (config) => {
  const path = new URL(config.url, location.origin).pathname;
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  calls.push({ path, method: config.method, body, params: config.params, credentials: config.withCredentials });
  if (path === hold) await new Promise((resolve) => { release = resolve; });
  if (failure?.path === path) {
    if (failure.code) throw { response: { status: failure.code }, config };
    throw new Error("모의 네트워크 실패");
  }
  let data;
  if (path === "/user/me") data = { userNo: 1, userCategoryNo: category, userId: "ai-test" };
  else if (path === "/center") data = [{ centerNo: 1, centerName: "검증 센터" }];
  else if (path === "/guardian") data = [{ guardianNo: 7, userNo: 1, guardianName: "검증 보호자" }];
  else if (path === "/carerecipient") data = [{ careRecipientNo: 21, guardianNo: 7, careRecipientName: "검증 수급자" }];
  else if (path === "/guardianinquiry") data = inquiries;
  else if (path === "/inquirycategory") data = categories;
  else if (["/api/careworkers", "/request/carerecipient", "/careworkerreport/center"].includes(path)) data = [];
  else if (path === "/api/ai/reviews/stats") data = stats;
  else if (path === "/api/ai/reviews") data = reviewItems.map((review) => ({ ...review }));
  else if (path === "/api/ai/reviews/analyze-pending") {
    data = [{ reviewNo: 2, sentiment: "긍정", cached: false }, { reviewNo: 6, error: "분석 실패" }];
    reviewItems = reviewItems.map((review) => review.reviewNo === 2 ? { ...review, analysisStatus: "analyzed", sentiment: "긍정", analyzedAt: "2026-10-14T12:00:00" } : review);
    stats = { ...stats, analyzed: 3, pending: 2, counts: { ...zeroes, "긍정": 3 } };
  }
  else if (path === "/api/ai/reviews/analyze") data = { reviewNo: config.params.reviewNo, sentiment: "긍정", cached: true };
  else if (path === "/api/ai/inquiries/drafts") {
    data = { inquiryCategoryNo: invalidDraft ? 999 : config.params.inquiryCategoryNo, questions: ["초안 질문 A", "초안 질문 B"] };
  }
  else if (path === "/api/ai/inquiries/answer") {
    if (invalidAnswer) data = false;
    else {
      const inquiryNo = 100 + inquiries.length;
      const answer = needsStaff ? "센터 확인을 기다려주세요." : "DB 근거 기반의 AI 답변입니다.";
      inquiries.push({ inquiryNo, guardianNo: 7, inquiryCategoryNo: Number(body.inquiryCategoryNo), inquiryContent: body.question,
        requestNo: body.requestNo, answerContent: needsStaff ? null : `[AI 안내] ${answer}`, createDate: "2026-10-14T10:00:00" });
      data = { inquiryNo, inquiryCategoryNo: Number(body.inquiryCategoryNo), answer, needsStaff, status: needsStaff ? "응답 대기" : "응답 완료" };
      if (refreshFails) failure = { path: "/guardianinquiry", code: 500 };
    }
  }
  else if (path === "/api/ai/faq/admin") data = faqs.map((faq) => ({ ...faq }));
  else if (path === "/api/ai/faq/generate") {
    const faq = { faqNo: 1, sourceInquiryNo: config.params.inquiryNo, question: "기록은 어디에서 확인하나요?", answer: inquiries[0].answerContent, approved: false };
    faqs = [faq]; data = faq;
  }
  else if (path === "/api/ai/faq") data = faqs.filter((faq) => faq.approved).map(({ faqNo, question }) => ({ faqNo, question }));
  else if (path.endsWith("/answer")) {
    const faq = faqs.find((faq) => faq.faqNo === Number(path.split("/")[4]) && faq.approved);
    if (!faq) throw { response: { status: 404 }, config };
    data = { ...faq };
  }
  else if (path.endsWith("/approve")) {
    data = mutationResult;
    if (data === true) faqs = faqs.map((faq) => ({ ...faq, approved: config.params.approved }));
  }
  else if (path === "/api/ai/faq/1" && config.method === "put") {
    data = mutationResult;
    if (data === true) faqs = faqs.map((faq) => ({ ...faq, ...body, approved: false }));
  }
  else throw new Error(`예상하지 않은 테스트 요청: ${path}`);
  return { data: typeof data === "string" ? JSON.stringify(data) : data, status: 200, statusText: "OK", headers: {}, config };
};

const sleep = () => new Promise((resolve) => setTimeout(resolve, 25));
const text = () => document.getElementById("root").textContent;
const button = (label) => [...document.querySelectorAll("button")].find((item) => item.textContent === label
  || (item.id.startsWith("ai-faq-question-") && item.querySelector("span")?.textContent === label));
async function waitFor(predicate, label) {
  for (let i = 0; i < 160; i++) { if (predicate()) return; await sleep(); }
  throw new Error(`대기 실패: ${label}`);
}
function check(value, label) {
  if (!value) throw new Error(label);
  passed.push(label);
  document.getElementById("results").textContent = passed.join("\n");
}
async function click(label) { const target = button(label); if (!target) throw new Error(`버튼 없음: ${label}`); target.click(); await sleep(); }
function change(element, value) {
  const prototype = element.tagName === "SELECT" ? HTMLSelectElement.prototype : element.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
  element.dispatchEvent(new Event(element.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
}
async function mount(element) { root.render(null); await sleep(); root.render(element); await sleep(); }
async function app(path, role) { category = role; await mount(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>); }
const callsTo = (path, method) => calls.filter((call) => call.path === path && (!method || call.method === method));
const management = () => <AiFaqManagement inquiries={inquiries} />;

async function run() {
  await app("/admin", 4);
  await waitFor(() => text().includes("전체 후기") && text().includes("오늘의 운영 현황"), "시스템 관리자 대시보드");
  check(text().includes("전체 센터 기준") && text().includes("서비스 후기 현황") && !text().includes("2건 · 100%"), "4번 관리자 대시보드에는 후기 요약만 표시");
  check(document.querySelector("main h2").textContent.includes("서비스 후기 현황"), "후기 요약이 대시보드 최상단에 표시");
  check(text().includes("총괄 센터") && text().includes("전체 센터 기준") && !button("전체 센터▾"), "main의 총괄 센터 체계와 전체 AI 통계 유지");
  document.querySelector('a[href="/admin/reviews"]').click(); await sleep();
  await waitFor(() => text().includes("2건 · 100%") && document.querySelector("h1")?.textContent === "서비스 후기", "별도 서비스 후기 페이지");
  check(!document.querySelector('[aria-label="단건 분석 후기 번호"]') && !button("후기 1건 분석"), "후기 번호 직접 입력을 제거하고 별도 페이지에 전체 분포 표시");
  await waitFor(() => text().includes("전체 6건 중 6건 표시"), "실제 계약의 후기 목록");
  check(text().includes("검증 후기 1") && button("원문 보기") && callsTo("/api/ai/reviews").length > 0, "관리자 후기 목록 API로 원문·평점·감정 조회");
  check([...document.querySelectorAll("nav button")].some((item) => item.textContent.includes("서비스 후기")), "4번 관리자 메뉴에 서비스 후기 추가");
  const beforeRole = calls.length;
  await app("/admin", 3);
  await waitFor(() => text().includes("오늘의 운영 현황"), "센터 관리자 대시보드");
  check(!text().includes("AI 후기") && !calls.slice(beforeRole).some((call) => call.path.startsWith("/api/ai")), "3번 관리자에게 통계 숨김 및 AI 요청 없음");
  const beforeReviewRoute = calls.length;
  await app("/admin/reviews", 3);
  await waitFor(() => text().includes("오늘의 운영 현황"), "센터 관리자 후기 페이지 접근");
  check(!text().includes("서비스 후기") && !calls.slice(beforeReviewRoute).some((call) => call.path.startsWith("/api/ai")), "3번 관리자 메뉴 숨김 및 후기 URL 직접 접근 차단");
  await app("/admin/inquiries", 3);
  await waitFor(() => text().includes("미응답 문의"), "센터 관리자 문의");
  check(!text().includes("AI FAQ 관리") && button("응답하기"), "3번 관리자 FAQ 숨김 및 기존 문의 응답 버튼 유지");
  await app("/admin/inquiries", 4);
  await waitFor(() => text().includes("AI FAQ 관리") && !text().includes("FAQ 목록을 불러오는 중"), "시스템 관리자 FAQ");
  check(text().includes("미응답 문의") && button("응답 수정") && button("삭제"), "4번 관리자 FAQ와 기존 문의 수정·삭제 기능 함께 표시");
  check(document.querySelector("main h2").textContent.includes("AI FAQ 관리"), "시스템 관리자 문의 화면 상단에 FAQ 관리 표시");
  const choices = [...document.querySelectorAll("select option")].map((item) => item.value);
  check(choices.includes("11") && !choices.includes("12") && !choices.includes("13"), "문의 내용·관리자 답변 모두 있는 문의만 생성 대상으로 표시");
  change(document.querySelector("select"), "11"); await sleep();
  hold = "/api/ai/faq/generate";
  await click("FAQ 초안 생성");
  const generateCount = callsTo(hold).length;
  button("초안 생성 중...").click(); await sleep();
  check(callsTo(hold).length === generateCount && button("초안 생성 중...").disabled, "FAQ 생성 중 중복 요청 차단");
  hold = ""; release();
  await waitFor(() => text().includes("FAQ #1"), "생성 결과");
  check(document.querySelectorAll("textarea")[1].value === inquiries[0].answerContent && text().includes("미승인"), "초안은 DB 관리자 답변을 미리보기하고 자동 승인하지 않음");
  await click("FAQ 승인");
  await waitFor(() => button("승인 해제"), "FAQ 승인");
  check(callsTo("/api/ai/faq/1/approve").at(-1).params.approved === true, "FAQ 승인에 approved=true 전달");
  const beforeRegenerate = callsTo("/api/ai/faq/generate").length;
  confirmResult = false;
  await click("FAQ 초안 생성");
  check(callsTo("/api/ai/faq/generate").length === beforeRegenerate && confirmations.at(-1).includes("승인이 해제"), "승인 FAQ 재생성 경고 및 취소하면 API 호출 없음");
  confirmResult = true;
  change(document.querySelectorAll("textarea")[0], "공통 질문 수정"); await sleep();
  mutationResult = false;
  await click("질문·답변 저장");
  check(text().includes("서버에서 처리하지 못했습니다") && button("승인 해제"), "수정 false 응답을 성공으로 표시하지 않음");
  mutationResult = "true";
  await click("질문·답변 저장");
  check(text().includes("응답 형식이 올바르지") && button("승인 해제"), "문자열 true 응답도 성공으로 처리하지 않음");
  mutationResult = true;
  await click("질문·답변 저장");
  await waitFor(() => button("FAQ 승인"), "수정 후 승인 해제");
  const saveCall = callsTo("/api/ai/faq/1", "put").at(-1);
  check(saveCall.body.question === "공통 질문 수정" && saveCall.body.answer === inquiries[0].answerContent && text().includes("미승인"), "question·answer 저장 후 미승인 재반영");
  await click("FAQ 승인"); await waitFor(() => button("승인 해제"), "재승인");
  await app("/guardian/request", 1);
  await waitFor(() => button("공통 질문 수정") && text().includes("요청 내역"), "보호자 문의 및 FAQ");
  document.querySelector("summary").click(); await sleep();
  check(text().includes("AI 문의 도우미") && text().includes("승인된 공통 FAQ") && document.querySelector("details").open, "AI 문의 도우미와 접기 가능한 공통 FAQ를 별도 표시");
  const beforeAnswer = calls.length;
  await click("공통 질문 수정");
  await waitFor(() => text().includes(inquiries[0].answerContent), "DB FAQ 답변");
  check(button("공통 질문 수정").getAttribute("aria-expanded") === "true" && calls.slice(beforeAnswer).every((call) => call.method === "get"), "보호자 FAQ 클릭은 답변 GET만 호출하며 문의를 변경하지 않음");
  await click("공통 질문 수정");
  check(button("공통 질문 수정").getAttribute("aria-expanded") === "false", "질문 다시 클릭하면 접힘");
  faqs[0].approved = false;
  await click("공통 질문 수정");
  await waitFor(() => text().includes("더 이상 승인된 FAQ"), "승인 해제 답변 404");
  check(!text().includes(inquiries[0].answerContent) && button("답변 다시 불러오기"), "404 발생 시 이전 답변을 숨기고 재시도 제공");
  await mount(<AiFaq />);
  await waitFor(() => text().includes("아직 공개된 공통 질문이 없습니다"), "미승인 질문 제외");
  check(!button("공통 질문 수정"), "승인 해제 FAQ는 새 보호자 목록에서 제외");
  await mount(management());
  await waitFor(() => button("FAQ 승인"), "미승인 관리");
  mutationResult = false;
  await click("FAQ 승인");
  check(text().includes("서버에서 처리하지 못했습니다") && button("FAQ 승인"), "승인 false 응답 시 미승인 유지");
  mutationResult = true;
  await click("FAQ 승인"); await waitFor(() => button("승인 해제"), "승인");
  await click("승인 해제"); await waitFor(() => button("FAQ 승인"), "승인 해제");
  check(callsTo("/api/ai/faq/1/approve").at(-1).params.approved === false, "승인 해제에 approved=false 전달 및 즉시 목록 반영");
  await mount(<AiReviewStats />);
  await waitFor(() => button("미분석 후기 분석") && !button("미분석 후기 분석").disabled, "대기 후기");
  hold = "/api/ai/reviews/analyze-pending";
  const beforeStats = callsTo("/api/ai/reviews/stats").length;
  await click("미분석 후기 분석");
  const analyzeCount = callsTo(hold).length;
  button("분석 중...").click(); await sleep();
  check(callsTo(hold).length === analyzeCount && button("통계 새로고침").disabled, "분석 중 중복 클릭 및 통계 요청 경쟁 차단");
  hold = ""; release();
  await waitFor(() => text().includes("성공 1건 · 실패 1건") && text().includes("대기 후기 2건"), "분석 결과");
  check(callsTo("/api/ai/reviews/stats").length === beforeStats + 1 && callsTo("/api/ai/reviews/analyze-pending").length === analyzeCount, "성공·실패 건수 표시 후 통계 1회 갱신, 자동 반복 없음");
  stats = { total: 0, analyzed: 0, pending: 0, noText: 0, counts: zeroes, percentages: zeroes };
  await click("통계 새로고침");
  await waitFor(() => text().includes("등록된 후기가 없습니다"), "후기 없음");
  check(text().includes("0건 · 0%") && button("미분석 후기 분석").disabled, "후기 0건의 분포와 분석 버튼 상태");
  stats = { ...stats, total: 2, noText: 2 };
  await click("통계 새로고침");
  await waitFor(() => text().includes("내용이 없는 후기는 분석 대상에서 제외"), "내용 없는 후기");
  check(button("미분석 후기 분석").disabled, "빈 후기만 있을 때 분석 대상 없음 안내");
  for (const code of [400, 403, 404, 502, 500, null]) {
    failure = { path: "/api/ai/reviews/stats", code };
    await app("/admin", 4);
    await waitFor(() => text().includes("오늘의 운영 현황") && document.querySelector('[role="alert"]'), `통계 오류 ${code}`);
    check(text().includes(code ? code === 500 ? "HTTP 500" : `(${code})` : "서버와 통신하지 못했습니다"), `${code || "통신"} 통계 오류 구분 및 기존 운영 화면 유지`);
  }
  failure = { path: "/api/ai/faq/admin", code: 403 };
  await app("/admin/inquiries", 4);
  await waitFor(() => text().includes("권한이 없습니다") && text().includes("미응답 문의"), "FAQ 관리 권한 오류");
  check(button("응답하기") && button("FAQ 초안 생성").disabled, "FAQ 403이어도 기존 관리자 문의 처리 유지");
  failure = { path: "/api/ai/faq", code: 502 };
  await app("/guardian/request", 1);
  await waitFor(() => text().includes("AI 서비스 호출에 실패") && text().includes("요청 내역"), "보호자 FAQ 오류");
  check(text().includes("요청 내역"), "FAQ 오류 시 기존 보호자 요청 내역 유지");
  failure = null;
  await app("/guardian/request", 1);
  await waitFor(() => document.querySelector('[aria-label="AI 문의 유형"]')?.options.length === 3 && text().includes("요청 내역"), "AI 문의 도우미");
  check([...document.querySelector('[aria-label="AI 문의 유형"]').options].map((item) => item.value).join(",") === "1,3,4", "문의 유형과 번호는 DB 목록 응답으로 표시");
  const questionInput = () => document.querySelector('[aria-label="AI 문의 내용"]');
  const categoryInput = () => document.querySelector('[aria-label="AI 문의 유형"]');
  change(categoryInput(), "4"); await sleep();
  hold = "/api/ai/inquiries/drafts";
  await click("질문 초안 받기");
  const draftCount = callsTo(hold).length;
  button("질문 생성 중...").click();
  await sleep();
  check(callsTo(hold).length === draftCount && categoryInput().disabled && categoryInput().value === "4", "초안 생성 중 중복 요청과 유형 변경 차단");
  hold = ""; release();
  await waitFor(() => button("초안 질문 A"), "질문 초안");
  const answerBeforeDraft = callsTo("/api/ai/inquiries/answer").length;
  await click("초안 질문 A");
  check(questionInput().value === "초안 질문 A" && callsTo("/api/ai/inquiries/answer").length === answerBeforeDraft, "초안 선택은 편집 입력만 채우며 문의를 등록하지 않음");
  change(questionInput(), "초안을 편집한 일반 질문"); await sleep();
  const beforeInquiry = calls.length;
  hold = "/api/ai/inquiries/answer";
  await click("AI 답변 받기 · 문의 등록");
  const answerCount = callsTo(hold).length;
  button("답변 확인 중...").click(); await sleep();
  check(callsTo(hold).length === answerCount && categoryInput().disabled && questionInput().disabled, "답변 등록 중 중복 제출·유형·내용 변경 차단");
  hold = ""; release();
  await waitFor(() => text().includes("이미 등록된 문의") && text().includes("REQUEST HISTORY · 4"), "저장 및 내역 갱신");
  const inquiryCall = callsTo("/api/ai/inquiries/answer").at(-1);
  check(inquiryCall.body.inquiryCategoryNo === "4" && inquiryCall.body.requestNo === null && !Object.hasOwn(inquiryCall.body, "guardianNo") && !Object.hasOwn(inquiryCall.body, "userNo"), "방문 선택 없이 일반 문의 등록, 사용자 번호를 보내지 않음");
  check(questionInput().value === "초안을 편집한 일반 질문" && text().includes("DB 근거 기반의 AI 답변입니다") && text().includes("응답 완료"), "등록 후 질문·답변·서버 상태를 유지하며 내역 갱신");
  check(calls.slice(beforeInquiry).filter((call) => call.method === "get").every((call) => call.path === "/guardianinquiry"), "AI 저장 후 문의 내역만 조회하고 방문 일정이나 배정을 변경하지 않음");
  check(button("AI 답변 받기 · 문의 등록").disabled, "이미 저장한 같은 질문 재제출 차단 및 inquiryNo 표시");
  change(categoryInput(), "3"); await sleep();
  check(questionInput().value === "" && !button("초안 질문 A") && !text().includes("DB 근거 기반의 AI 답변입니다"), "유형 전환 시 이전 초안·질문·답변 초기화");
  needsStaff = true;
  change(questionInput(), "담당자 변경 문의"); await sleep();
  await click("AI 답변 받기 · 문의 등록");
  await waitFor(() => text().includes("센터 확인을 기다려주세요") && text().includes("REQUEST HISTORY · 5"), "센터 대기 등록");
  check(text().includes("응답 대기") && text().includes("같은 질문을 기존 문의 작성으로 다시 등록하지"), "needsStaff=true의 서버 응답 대기 상태 및 중복 문의 방지 안내");
  change(categoryInput(), "1"); await sleep();
  await click("희망 날짜·시간 입력 위치 보기");
  check(document.activeElement.id === "guardian-request-form", "실제 일정 변경은 기존 희망 날짜·시간 입력 위치로 안내");
  change(categoryInput(), "4"); await sleep();
  needsStaff = false;
  refreshFails = true;
  change(questionInput(), "내역 갱신 실패 검증 질문"); await sleep();
  await click("AI 답변 받기 · 문의 등록");
  await waitFor(() => text().includes("내역을 갱신하지 못했습니다") && text().includes("이미 등록된 문의"), "내역 갱신 실패");
  check(questionInput().value === "내역 갱신 실패 검증 질문" && text().includes("DB 근거 기반의 AI 답변입니다") && button("AI 답변 받기 · 문의 등록").disabled, "내역 갱신 실패에도 저장된 답변·입력·중복 방지 유지");
  failure = null; refreshFails = false;
  await click("문의 내역 새로고침");
  await waitFor(() => text().includes("REQUEST HISTORY · 6"), "문의 내역 재시도");
  check(text().includes("DB 근거 기반의 AI 답변입니다"), "내역 재시도 성공 후에도 AI 답변 유지");
  await app("/admin/inquiries", 4);
  await waitFor(() => text().includes("내역 갱신 실패 검증 질문"), "관리자 AI 문의 조회");
  const aiRow = [...document.querySelectorAll("tbody tr")].find((row) => row.textContent.includes("내역 갱신 실패 검증 질문"));
  const pendingRow = [...document.querySelectorAll("tbody tr")].find((row) => row.textContent.includes("담당자 변경 문의"));
  check(aiRow.textContent.includes("✨ AI 안내") && aiRow.textContent.includes("응답 완료") && aiRow.textContent.includes("응답 수정"), "관리자 문의에서 [AI 안내] 답변 구분과 기존 응답 수정 유지");
  check(pendingRow.textContent.includes("응답 대기") && pendingRow.textContent.includes("응답하기"), "AI 센터 대기 문의도 answerContent 기준으로 기존 처리 가능");
  let savedCount = 0;
  await mount(<AiInquiryAssistant categories={categories} requestNo={21} onSaved={() => { savedCount++; }} />);
  await waitFor(() => categoryInput()?.value === "1", "방문 연결 문의");
  change(questionInput(), "연결한 방문 질문"); await sleep();
  await click("AI 답변 받기 · 문의 등록");
  await waitFor(() => text().includes("이미 등록된 문의"), "연결한 방문 저장");
  check(callsTo("/api/ai/inquiries/answer").at(-1).body.requestNo === "21" && savedCount === 1, "선택된 본인 방문 번호를 문자열 requestNo로 전달");
  for (const code of [400, 403, 404, 502]) {
    await mount(<AiInquiryAssistant categories={categories} />);
    await waitFor(() => categoryInput()?.value === "1", "문의 오류 검증");
    failure = { path: "/api/ai/inquiries/answer", code };
    change(questionInput(), "오류 검증 질문"); await sleep();
    await click("AI 답변 받기 · 문의 등록");
    await waitFor(() => text().includes(`(${code})`), `문의 답변 오류 ${code}`);
    check(!text().includes("이미 등록된 문의") && questionInput().value === "오류 검증 질문", `${code} 문의 오류를 성공으로 숨기지 않고 입력 유지`);
  }
  failure = null;
  await mount(<AiInquiryAssistant categories={categories} />);
  await waitFor(() => categoryInput()?.value === "1", "잘못된 응답");
  invalidDraft = true;
  await click("질문 초안 받기");
  await waitFor(() => text().includes("응답 형식이 올바르지"), "다른 유형 응답");
  check(!button("초안 질문 A"), "다른 유형 번호로 반환된 초안 응답 표시 차단");
  invalidDraft = false; invalidAnswer = true;
  change(questionInput(), "false 응답 검증"); await sleep();
  await click("AI 답변 받기 · 문의 등록");
  await waitFor(() => text().includes("응답 형식이 올바르지"), "false 답변");
  check(!text().includes("이미 등록된 문의"), "HTTP 200 boolean false를 문의 저장 성공으로 표시하지 않음");
  invalidAnswer = false;
  const beforeLength = callsTo("/api/ai/inquiries/answer").length;
  change(questionInput(), "가".repeat(1001)); await sleep();
  await click("AI 답변 받기 · 문의 등록");
  check(callsTo("/api/ai/inquiries/answer").length === beforeLength && text().includes("1,000자 이내"), "1,000자 초과 문의를 요청 단계에서도 차단");
  await mount(<AiInquiryAssistant categories={categories} />);
  await waitFor(() => categoryInput()?.value === "1", "늦은 초안");
  hold = "/api/ai/inquiries/drafts";
  await click("질문 초안 받기");
  await mount(<AiInquiryAssistant categories={[categories[2]]} />);
  await waitFor(() => categoryInput()?.value === "4", "새 유형 화면");
  hold = ""; release(); await sleep();
  check(!button("초안 질문 A") && categoryInput().value === "4", "이전 유형 화면의 늦은 응답은 취소하고 새 화면에 표시하지 않음");
  await mount(<AiInquiryAssistant categories={[]} />);
  check(button("질문 초안 받기").disabled && text().includes("조회된 문의 유형이 없습니다"), "DB 유형 빈 목록 안내와 요청 차단");
  await app("/guardian/request", 1);
  await waitFor(() => text().includes("요청 내역") && categoryInput()?.options.length === 3, "빈 FAQ와 도우미");
  faqs[0].approved = false;
  document.querySelector("summary").click(); await sleep();
  await click("새로고침");
  await waitFor(() => text().includes("아직 공개된 공통 질문이 없습니다"), "빈 공통 FAQ");
  check(!button("질문 초안 받기").disabled, "공통 FAQ가 0건이어도 AI 질문 초안 기능 사용 가능");
  check(document.documentElement.scrollWidth <= window.innerWidth, "보호자 AI 도우미·공통 FAQ 화면 가로 넘침 없음");
  faqs[0].approved = true;
  await mount(<AiFaq />);
  await waitFor(() => button("공통 질문 수정"), "답변 취소 검증");
  hold = "/api/ai/faq/1/answer";
  await click("공통 질문 수정");
  await click("공통 질문 수정");
  hold = ""; release(); await sleep();
  check(button("공통 질문 수정").getAttribute("aria-expanded") === "false" && !text().includes(inquiries[0].answerContent), "접은 질문의 늦은 응답 표시 차단");
  check(calls.filter((call) => call.path.startsWith("/api/ai")).every((call) => call.credentials === true), "모든 AI 요청에 withCredentials=true 적용");
  check(!calls.some((call) => call.path.includes("gemini")), "브라우저에서 Gemini 직접 호출 없음");
  const beforeCaregiver = calls.length;
  await app("/admin", 2);
  await waitFor(() => text().includes("요양보호사 정보") || text().includes("연결된 요양보호사"), "요양보호사 접근");
  check(!calls.slice(beforeCaregiver).some((call) => call.path.startsWith("/api/ai")), "2번 요양보호사의 관리자 URL 접근 시 AI API 호출 없음");
  await mount(management());
  await waitFor(() => text().includes("FAQ #1"), "최종 검증 화면");
  check(document.documentElement.scrollWidth <= window.innerWidth, "FAQ 관리 화면 가로 넘침 없음");
  window.aiTestResult = { passed, count: passed.length, viewport: window.innerWidth, mode: "mock browser (실제 로그인·DB 미검증)" };
}
run().catch((error) => {
  document.getElementById("results").textContent += `\n실패: ${error.message}`;
  window.aiTestResult = { passed, error: error.message };
});
