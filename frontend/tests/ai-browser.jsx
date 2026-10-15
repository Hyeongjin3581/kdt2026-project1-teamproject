// 개발 서버 전용 모의 API 검증. 실제 인증이나 DB 저장 성공을 증명하지 않는다.
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import App from "../src/App";
import AiReviewStats from "../src/features/admin/dashboard/AiReviewStats";
import AiFaqManagement from "../src/features/admin/inquiries/AiFaqManagement";
import AiFaq from "../src/features/guardian/request/AiFaq";
import AiInquiryAssistant from "../src/features/guardian/request/AiInquiryAssistant";
import { todayIso } from "../src/utils/guardianAdapters";
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
let resolution = "answered";
let invalidConsult = false;
let consultOverride = null;
let loseHandoffResponse = false;
let handoffStatus = "응답 대기";
const handoffs = new Map();
let refreshFails = false;
let includeVisit = false;
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
  else if (path === "/guardianinquiry") {
    if (config.method === "post") {
      inquiries.push({ ...body, inquiryNo: 100 + inquiries.length, answerContent: null, createDate: `${todayIso}T10:00:00` });
      data = true;
    } else data = inquiries;
  }
  else if (path === "/inquirycategory") data = categories;
  else if (path === "/request/carerecipient") data = includeVisit ? [{ requestNo: 71, careRecipientNo: 21, visitDate: todayIso, visitStartTime: "09:00:00", visitEndTime: "12:00:00", requestState: "신청" }] : [];
  else if (["/api/careworkers", "/careworkerreport/center"].includes(path)) data = [];
  else if (path === "/api/ai/reviews/stats") data = stats;
  else if (path === "/api/ai/reviews") data = reviewItems.map((review) => ({ ...review }));
  else if (path === "/api/ai/reviews/analyze-pending") {
    data = [{ reviewNo: 2, sentiment: "긍정", cached: false }, { reviewNo: 6, error: "분석 실패" }];
    reviewItems = reviewItems.map((review) => review.reviewNo === 2 ? { ...review, analysisStatus: "analyzed", sentiment: "긍정", analyzedAt: "2026-10-14T12:00:00" } : review);
    stats = { ...stats, analyzed: 3, pending: 2, counts: { ...zeroes, "긍정": 3 } };
  }
  else if (path === "/api/ai/reviews/analyze") data = { reviewNo: config.params.reviewNo, sentiment: "긍정", cached: true };
  else if (path === "/api/ai/inquiries/consult") {
    data = consultOverride ?? (invalidConsult ? false : { answer: resolution === "answered" ? "DB 근거 기반의 AI 답변입니다." : resolution === "scheduleRequired" ? "희망 날짜와 시간을 입력해 주세요." : "담당 센터 확인이 필요합니다.", resolution, sourceFaqNos: resolution === "answered" ? [1] : [] });
  }
  else if (path === "/api/ai/inquiries/handoff") {
    const previous = handoffs.get(body.requestId);
    if (previous && (previous.question !== body.question || previous.requestNo !== body.requestNo)) throw { response: { status: 409 }, config };
    if (previous) data = { ...previous.response, status: handoffStatus };
    else {
      const inquiryNo = 100 + inquiries.length;
      inquiries.push({ inquiryNo, guardianNo: 7, inquiryCategoryNo: 4, inquiryContent: body.question, requestNo: body.requestNo, answerContent: null, createDate: `${todayIso}T10:00:00` });
      data = { inquiryNo, inquiryCategoryNo: 4, status: handoffStatus };
      handoffs.set(body.requestId, { ...body, response: data });
    }
    if (refreshFails) failure = { path: "/guardianinquiry", code: 500 };
    if (loseHandoffResponse) { loseHandoffResponse = false; throw new Error("접수 후 응답 유실 모의"); }
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
  check([...document.querySelectorAll("h2")].filter((heading) => heading.textContent === "AI 문의").length === 1 && !document.querySelector('[aria-label="AI 문의 유형"]') && !document.querySelector("details"), "중복 제목·유형 선택 없이 AI 문의 한 영역에 표시");
  check(getComputedStyle(document.querySelector("h1")).fontFamily === getComputedStyle(document.querySelector('[aria-label="AI 문의 내용"]')).fontFamily, "요청 문의 제목과 입력 글꼴을 기본 본문 글꼴로 통일");
  const beforeNewInquiry = calls.length;
  await click("다른 질문하기");
  check(document.activeElement.getAttribute("aria-label") === "AI 문의 내용" && !calls.slice(beforeNewInquiry).some((call) => call.method === "post"), "FAQ의 다른 질문하기는 같은 AI 입력란으로 이동하며 문의를 접수하지 않음");
  const beforeAnswer = calls.length;
  await click("공통 질문 수정");
  await waitFor(() => text().includes(inquiries[0].answerContent), "DB FAQ 답변");
  check(button("공통 질문 수정").getAttribute("aria-expanded") === "true" && calls.slice(beforeAnswer).every((call) => call.method === "get"), "보호자 FAQ 클릭은 답변 GET만 호출하며 문의를 변경하지 않음");
  faqs.push({ faqNo: 2, sourceInquiryNo: 12, question: "다른 추천 질문", answer: "다른 DB 저장 답변", approved: true });
  await click("새로고침");
  await waitFor(() => button("다른 추천 질문"), "여러 FAQ");
  hold = "/api/ai/faq/2/answer";
  await click("다른 추천 질문");
  check(text().includes("저장된 답변을 불러오는 중"), "FAQ 질문 클릭 시 답변 조회 로딩 표시");
  await click("공통 질문 수정");
  await waitFor(() => text().includes(inquiries[0].answerContent), "다른 질문으로 전환");
  hold = ""; release(); await sleep();
  check(button("공통 질문 수정").getAttribute("aria-expanded") === "true" && button("다른 추천 질문").getAttribute("aria-expanded") === "false" && !text().includes("다른 DB 저장 답변"), "질문 전환 후 늦은 이전 답변은 취소하고 선택한 DB 답변만 표시");
  faqs = faqs.filter((item) => item.faqNo === 1);
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
  const questionInput = () => document.querySelector('[aria-label="AI 문의 내용"]');
  await waitFor(() => questionInput() && text().includes("요청 내역"), "통합 AI 상담");
  check(!document.querySelector('[aria-label="AI 문의 유형"]') && !button("질문 초안 받기"), "유형 선택·AI 초안 제거");
  const initialInquiries = inquiries.length;
  const beforeConsult = calls.length;
  hold = "/api/ai/inquiries/consult";
  change(questionInput(), "일지는 어디서 봐요?"); await sleep(); await click("질문하기");
  const consultCount = callsTo(hold).length;
  button("답변 확인 중...").click(); await sleep();
  check(callsTo(hold).length === consultCount && questionInput().disabled, "상담 중 중복 질문과 내용 변경 차단");
  hold = ""; release();
  await waitFor(() => text().includes("DB 근거 기반의 AI 답변입니다"), "AI 안내");
  check(inquiries.length === initialInquiries && !button("센터에 문의 전달") && !text().includes("접수되었습니다"), "answered는 안내만 표시하고 관리자 문의 생성 없음");
  const consultCall = callsTo("/api/ai/inquiries/consult").at(-1);
  check(consultCall.body.question === "일지는 어디서 봐요?" && consultCall.body.requestNo === null && Object.keys(consultCall.body).length === 2, "상담에는 질문·방문만 전달하고 사용자·유형 번호 제외");
  check(!calls.slice(beforeConsult).some((call) => call.path === "/guardianinquiry"), "상담만으로 문의 내역 재조회 없음");
  resolution = "scheduleRequired";
  change(questionInput(), "내일 방문을 10시로 바꿔주세요"); await sleep(); await click("질문하기");
  await waitFor(() => button("일정 변경 요청하기"), "일정 변경 분기");
  await click("일정 변경 요청하기");
  check(document.activeElement.id === "guardian-request-form" && inquiries.length === initialInquiries && !button("센터에 문의 전달"), "일정 변경은 기존 폼 이동만 수행하고 자동 접수 없음");
  resolution = "staffRequired";
  change(questionInput(), "센터에서 확인할 질문"); await sleep(); await click("질문하기");
  await waitFor(() => button("센터에 문의 전달"), "담당자 확인 분기");
  check(inquiries.length === initialInquiries && text().includes("아직 접수되지 않았습니다"), "staffRequired도 사용자 전달 전 저장 없음");
  hold = "/api/ai/inquiries/handoff";
  await click("센터에 문의 전달");
  const handoffCount = callsTo(hold).length;
  button("전달 중...").click(); await sleep();
  check(callsTo(hold).length === handoffCount && questionInput().disabled, "전달 중 중복 클릭·내용 변경 차단");
  hold = ""; release();
  await waitFor(() => text().includes("센터에 문의가 접수되었습니다"), "접수 확인");
  await waitFor(() => text().includes("센터에서 확인할 질문"), "접수 내역 갱신");
  check(inquiries.length === initialInquiries + 1 && !button("센터에 문의 전달") && button("질문하기").disabled, "명시적 전달로만 1건 생성하고 재접수 차단");
  const firstHandoff = callsTo("/api/ai/inquiries/handoff").at(-1);
  check(/^[0-9a-f-]{36}$/i.test(firstHandoff.body.requestId) && firstHandoff.body.question === "센터에서 확인할 질문" && inquiries.at(-1).answerContent === null, "UUID·원문 전달과 실제 응답 대기 상태 사용");
  change(questionInput(), "응답 유실 검증 질문"); await sleep(); await click("질문하기");
  await waitFor(() => button("센터에 문의 전달"), "재시도할 상담");
  loseHandoffResponse = true; await click("센터에 문의 전달");
  await waitFor(() => text().includes("문의 전달 결과를 확인하지 못했습니다"), "응답 유실");
  const lostBody = callsTo("/api/ai/inquiries/handoff").at(-1).body;
  const afterLost = inquiries.length;
  check(!text().includes("접수되었습니다") && questionInput().value === "응답 유실 검증 질문", "응답 유실을 성공으로 단정하지 않고 입력 유지");
  handoffStatus = "응답 완료";
  await click("센터에 문의 전달");
  await waitFor(() => text().includes("센터에 문의가 접수되었습니다"), "기존 접수 확인");
  check(JSON.stringify(callsTo("/api/ai/inquiries/handoff").at(-1).body) === JSON.stringify(lostBody) && inquiries.length === afterLost && text().includes("응답 완료"), "응답 유실 재시도는 같은 키·내용으로 기존 번호·최신 상태 사용");
  handoffStatus = "응답 대기";
  change(questionInput(), "충돌 검증 질문"); await sleep(); await click("질문하기");
  await waitFor(() => button("센터에 문의 전달"), "충돌 상담");
  failure = { path: "/api/ai/inquiries/handoff", code: 409 };
  const beforeConflict = callsTo("/api/ai/inquiries/handoff").length;
  await click("센터에 문의 전달"); await waitFor(() => text().includes("(409)"), "접수 키 충돌");
  check(button("센터에 문의 전달").disabled && callsTo("/api/ai/inquiries/handoff").length === beforeConflict + 1 && !text().includes("접수되었습니다"), "409에서 새 키 자동 생성·접수 차단");
  failure = null;
  change(questionInput(), "내용을 변경한 새 접수"); await sleep(); await click("질문하기");
  await waitFor(() => button("센터에 문의 전달") && !button("센터에 문의 전달").disabled, "새 접수 의도");
  refreshFails = true; await click("센터에 문의 전달");
  await waitFor(() => text().includes("내역을 갱신하지 못했습니다") && text().includes("센터에 문의가 접수되었습니다"), "접수 후 갱신 오류");
  check(callsTo("/api/ai/inquiries/handoff").at(-1).body.requestId !== lostBody.requestId && !button("센터에 문의 전달"), "새 내용은 새 UUID, 내역 오류에도 접수 완료 유지");
  failure = null; refreshFails = false; await click("문의 내역 새로고침");
  await waitFor(() => text().includes("내용을 변경한 새 접수") && !text().includes("내역을 갱신하지 못했습니다"), "내역 재조회");
  check(text().includes("센터에 문의가 접수되었습니다"), "내역 재조회 후 접수 결과 유지");
  for (const code of [400, 403, 502, null]) {
    await mount(<AiInquiryAssistant />);
    failure = { path: "/api/ai/inquiries/consult", code };
    const beforeFailure = inquiries.length;
    change(questionInput(), "오류 검증 질문"); await sleep(); await click("질문하기");
    await waitFor(() => document.querySelector('[role="alert"]'), "상담 오류");
    check(inquiries.length === beforeFailure && !button("센터에 문의 전달") && questionInput().value === "오류 검증 질문", `${code ?? "통신"} 상담 오류는 자동 인계하지 않고 입력 유지`);
  }
  failure = null; invalidConsult = true;
  await mount(<AiInquiryAssistant />);
  change(questionInput(), "잘못된 응답"); await sleep(); await click("질문하기");
  await waitFor(() => text().includes("응답 형식이 올바르지"), "잘못된 상담 응답");
  check(!button("센터에 문의 전달"), "200 false 응답을 답변·인계로 처리하지 않음");
  invalidConsult = false;
  for (const invalid of [
    { answer: "안내", resolution: "unknown", sourceFaqNos: [] },
    { answer: " ", resolution: "staffRequired", sourceFaqNos: [] },
    { answer: "안내", resolution: "answered", sourceFaqNos: ["1"] },
  ]) {
    consultOverride = invalid;
    await click("질문하기"); await waitFor(() => text().includes("응답 형식이 올바르지"), "잘못된 상담 계약");
    check(!button("센터에 문의 전달"), "알 수 없는 분기·빈 답변·잘못된 근거 번호는 표시·접수 차단");
  }
  consultOverride = null;
  const beforeLength = callsTo("/api/ai/inquiries/consult").length;
  change(questionInput(), "가".repeat(1001)); await sleep(); await click("질문하기");
  check(callsTo("/api/ai/inquiries/consult").length === beforeLength && text().includes("1,000자 이내"), "1000자 초과 질문 요청 차단");
  for (const code of [400, 403, 502]) {
    await mount(<AiInquiryAssistant />);
    change(questionInput(), "전달 실패 검증"); await sleep(); await click("질문하기");
    await waitFor(() => button("센터에 문의 전달"), "전달 오류 상담");
    failure = { path: "/api/ai/inquiries/handoff", code };
    await click("센터에 문의 전달");
    await waitFor(() => document.querySelector('[role="alert"]'), "전달 오류");
    const failedHandoff = callsTo("/api/ai/inquiries/handoff").at(-1).body;
    check(!text().includes("접수되었습니다") && questionInput().value === "전달 실패 검증", `${code} 전달 실패를 성공으로 표시하지 않음`);
    failure = null;
    if (code === 502) {
      await click("센터에 문의 전달"); await waitFor(() => text().includes("접수되었습니다"), "502 전달 재시도");
      check(callsTo("/api/ai/inquiries/handoff").at(-1).body.requestId === failedHandoff.requestId, "502 재시도에도 동일한 UUID 사용");
    }
  }
  await mount(<AiInquiryAssistant requestNo={21} />);
  change(questionInput(), "방문 연결 질문"); await sleep(); await click("질문하기");
  await waitFor(() => button("센터에 문의 전달"), "본인 방문 연결");
  await click("센터에 문의 전달"); await waitFor(() => text().includes("접수되었습니다"), "본인 방문 접수");
  check(callsTo("/api/ai/inquiries/consult").at(-1).body.requestNo === "21" && callsTo("/api/ai/inquiries/handoff").at(-1).body.requestNo === "21", "상담·전달 모두 선택 방문 번호를 문자열로 전송");
  await mount(<AiInquiryAssistant requestNo={21} />);
  hold = "/api/ai/inquiries/consult";
  change(questionInput(), "이전 방문 질문"); await sleep(); await click("질문하기");
  root.render(<AiInquiryAssistant requestNo={22} />); await sleep();
  hold = ""; release(); await sleep();
  check(!button("센터에 문의 전달") && !text().includes("담당 센터 확인 필요"), "방문 변경 후 이전 상담 응답 표시 차단");
  await app("/guardian/request", 1);
  await waitFor(() => questionInput() && text().includes("요청 내역"), "빈 FAQ에서도 직접 질문");
  faqs[0].approved = false; await click("새로고침");
  await waitFor(() => text().includes("아직 공개된 공통 질문이 없습니다"), "빈 FAQ");
  change(questionInput(), "추천 질문이 없는 상담"); await sleep();
  check(!button("질문하기").disabled, "FAQ가 없어도 직접 질문 입력·상담 가능");
  check(!calls.some((call) => ["/api/ai/inquiries/answer", "/api/ai/inquiries/drafts"].includes(call.path)), "새 화면에서 이전 저장·초안 API 호출 없음");

  includeVisit = true;
  await app("/guardian/request", 1);
  await waitFor(() => [...document.querySelectorAll("button")].some((item) => item.textContent.includes("09:00 ~ 12:00")), "기존 문의에 연결할 방문");
  const beforeDirect = calls.length;
  await click("다른 질문하기");
  [...document.querySelectorAll("button")].find((item) => item.textContent.includes("09:00 ~ 12:00")).click(); await sleep();
  const directPanel = document.getElementById("guardian-request-form").closest("section");
  change(directPanel.querySelector("select"), "기타 문의"); await sleep();
  change(directPanel.querySelector("textarea"), "직접 작성한 센터 문의"); await sleep();
  check(!calls.slice(beforeDirect).some((call) => call.method === "post"), "일반 문의는 작성만으로 등록되지 않음");
  await click("요청 보내기");
  await waitFor(() => text().includes("요청이 센터에 전달되었습니다"), "일반 문의 제출");
  const directPosts = calls.slice(beforeDirect).filter((call) => call.method === "post");
  check(directPosts.length === 1 && directPosts[0].path === "/guardianinquiry" && directPosts[0].body.requestNo === 71 && directPosts[0].body.inquiryCategoryNo === 4 && directPosts[0].credentials === true, "명시적 제출 시 기존 문의 API에 방문·유형·원문을 전달하고 AI 답변 API는 호출하지 않음");
  check(inquiries.at(-1).answerContent === null && text().includes("직접 작성한 센터 문의"), "일반 문의는 자동 AI 답변 없이 담당자 응답 대기로 내역에 표시");
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
  faqs.push(
    { faqNo: 2, question: "방문 일정 변경은 어떻게 요청하나요?", answer: "요청·문의에서 방문 일정을 선택해 희망 날짜와 시간을 입력해주세요.", approved: true },
    { faqNo: 3, question: "문의 답변은 어디서 확인하나요?", answer: "요청 내역에서 작성한 문의를 선택해 확인해주세요.", approved: true },
  );
  await app("/guardian/request", 1);
  await waitFor(() => button("문의 답변은 어디서 확인하나요?") && text().includes("요청 내역"), "여러 FAQ가 있는 통합 상담 화면");
  check(document.querySelectorAll('button[id^="ai-faq-question-"]').length === 3 && document.querySelectorAll('[aria-label="AI 문의 내용"]').length === 1, "서버의 여러 FAQ와 직접 질문 입력을 한 상담 영역에 표시");
  faqs.push(...[4, 5, 6, 7].map((faqNo) => ({ faqNo, question: `추가 공통 질문 ${faqNo}`, answer: `저장된 안내 ${faqNo}`, approved: true })));
  await click("새로고침");
  await waitFor(() => button("추천 질문 더 보기 (7개)"), "FAQ 전체 목록");
  check(document.querySelectorAll('button[id^="ai-faq-question-"]').length === 3, "대표 질문 3개만 먼저 표시");
  await click("추천 질문 더 보기 (7개)");
  check(document.querySelectorAll('button[id^="ai-faq-question-"]').length === 7, "더 보기로 서버 FAQ 전체 표시");
  await click("추가 공통 질문 7");
  await waitFor(() => text().includes("저장된 안내 7"), "펼친 FAQ 답변");
  await click("추천 질문 접기");
  check(!text().includes("저장된 안내 7") && document.querySelectorAll('button[id^="ai-faq-question-"]').length === 3, "추천 목록을 접으면 숨긴 답변도 제거");
  const counseling = document.querySelector('[aria-label="AI 문의 내용"]').closest("section");
  check(counseling.getBoundingClientRect().width <= document.documentElement.clientWidth, "통합 AI 상담 카드가 화면 너비 안에 표시");
  window.scrollTo(0, 0); await sleep();
  window.aiTestResult = { passed, count: passed.length, viewport: window.innerWidth, mode: "mock browser (실제 로그인·DB 미검증)" };
}
run().catch((error) => {
  document.getElementById("results").textContent += `\n실패: ${error.message}`;
  window.aiTestResult = { passed, error: error.message };
});
