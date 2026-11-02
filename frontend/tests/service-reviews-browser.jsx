// 모의 API를 이용한 제품 컴포넌트 검증. 실제 인증·Gemini·DB 변경은 하지 않는다.
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import ServiceReviews from "../src/features/admin/reviews/ServiceReviews";
import "../src/index.css";

const root = createRoot(document.getElementById("root"));
const passed = [];
const calls = [];
const names = ["매우 긍정", "긍정", "중립", "부정", "매우 부정"];
const fullText = "보호자가 작성한 실제 응답 형식의 검증 원문입니다.\n" + "친절한 설명과 시간 약속에 대한 의견입니다. ".repeat(8);
const fixtures = [
  { reviewNo: 4, careworkersReportNo: 12, guardianName: "검증 보호자 A", careworkerNo: 1, careworkerName: "검증 요양보호사 A", rating: 10, reviewContent: fullText, createDate: "2026-10-14T16:00:02.924003", updateDate: "2026-10-14T17:10:16.359149", sentiment: "긍정", analysisStatus: "analyzed", analyzedAt: "2026-10-14T17:10:42" },
  { reviewNo: 3, careworkersReportNo: 1, guardianName: "검증 보호자 A", careworkerNo: 1, careworkerName: "검증 요양보호사 A", rating: 9, reviewContent: "중립 후기 원문", createDate: "2026-10-14T15:53:42.331612", updateDate: null, sentiment: "중립", analysisStatus: "analyzed", analyzedAt: "2026-10-14T17:07:12" },
  { reviewNo: 2, careworkersReportNo: 22, guardianName: "검증 보호자 B", careworkerNo: 2, careworkerName: "검증 요양보호사 B", rating: 9, reviewContent: "수정된 후기 원문", createDate: "2026-10-13T15:00:00", updateDate: "2026-10-14T15:00:00", sentiment: null, analysisStatus: "pending", analyzedAt: null },
  { reviewNo: 1, careworkersReportNo: null, guardianName: null, careworkerNo: null, careworkerName: null, rating: null, reviewContent: " ", createDate: null, updateDate: null, sentiment: null, analysisStatus: "noText", analyzedAt: null },
];
let reviews = fixtures.map((item) => ({ ...item }));
let failure = null;
let invalidList = false;
let mutation = "ok";
let hold = "";
let release;
let cached = false;
let failReload = false;
let failBatch = false;
let withMismatchStats = false;

function stats() {
  const counts = Object.fromEntries(names.map((name) => [name, 0]));
  const analyzed = reviews.filter((item) => item.analysisStatus === "analyzed");
  analyzed.forEach((item) => { counts[item.sentiment]++; });
  return { ...(withMismatchStats ? { mismatchCount: reviews.filter((item) => item.ratingSentimentMismatch === true).length } : {}), total: reviews.length, analyzed: analyzed.length, pending: reviews.filter((item) => item.analysisStatus === "pending").length,
    noText: reviews.filter((item) => item.analysisStatus === "noText").length, counts,
    percentages: Object.fromEntries(names.map((name) => [name, analyzed.length ? Math.round(counts[name] * 1000 / analyzed.length) / 10 : 0])) };
}
axios.defaults.adapter = async (config) => {
  const path = new URL(config.url, location.origin).pathname;
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  calls.push({ path, method: config.method, params: config.params, credentials: config.withCredentials, body });
  if (path === hold) await new Promise((resolve) => { release = resolve; });
  if (failure?.path === path) {
    if (failure.code) throw { response: { status: failure.code }, config };
    throw new Error("모의 통신 실패");
  }
  let data;
  if (path === "/center") data = [];
  else if (path === "/api/ai/reviews") data = invalidList ? {} : reviews.map((item) => ({ ...item }));
  else if (path === "/api/ai/reviews/stats") data = stats();
  else if (path === "/api/ai/reviews/analyze" || path === "/api/ai/reviews/analyze-pending") {
    if (mutation === "false") data = false;
    else if (mutation === "mismatch") data = { reviewNo: 999, sentiment: "긍정", cached: false };
    else if (failBatch && path.endsWith("analyze-pending")) data = [{ reviewNo: 2, error: "분석 실패" }];
    else {
      const target = path.endsWith("analyze") ? config.params.reviewNo : reviews.find((item) => item.analysisStatus === "pending")?.reviewNo;
      reviews = reviews.map((item) => item.reviewNo === target ? { ...item, analysisStatus: "analyzed", sentiment: "부정", analyzedAt: "2026-10-14T18:00:00" } : item);
      const result = { reviewNo: target, sentiment: "부정", cached };
      data = path.endsWith("analyze") ? result : target == null ? [] : [result];
      if (failReload) failure = { path: "/api/ai/reviews", code: 500 };
    }
  } else throw new Error(`명세 외 요청: ${path}`);
  return { data, status: 200, statusText: "OK", headers: {}, config };
};

const sleep = () => new Promise((resolve) => setTimeout(resolve, 25));
const text = () => document.getElementById("root").textContent;
const button = (label) => [...document.querySelectorAll("button")].find((item) => item.textContent === label);
const row = (content) => [...document.querySelectorAll("tbody tr")].find((item) => item.textContent.includes(content));
const callCount = (path) => calls.filter((item) => item.path === path).length;
const dialog = () => document.querySelector('[role="dialog"]');
const search = () => document.querySelector('[aria-label="후기 검색"]');
const state = () => document.querySelector('[aria-label="후기 분석 상태"]');
const sentiment = () => document.querySelector('[aria-label="후기 감정"]');
function change(element, value) {
  const prototype = element.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
  element.dispatchEvent(new Event(element.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
}
async function waitFor(predicate, label) {
  for (let i = 0; i < 160; i++) { if (predicate()) return; await sleep(); }
  throw new Error(`대기 실패: ${label}`);
}
function check(value, label) {
  if (!value) throw new Error(label);
  passed.push(label); document.getElementById("results").textContent = passed.join("\n");
}
async function click(label) { const target = button(label); if (!target) throw new Error(`버튼 없음: ${label}`); target.click(); await sleep(); }
async function mount(path = "/admin/reviews") { root.render(null); await sleep(); root.render(<MemoryRouter initialEntries={[path]}><ServiceReviews /></MemoryRouter>); await sleep(); }
async function ready() { await waitFor(() => text().includes("전체 4건 중 4건 표시"), "후기 목록"); }

async function run() {
  hold = "/api/ai/reviews";
  await mount();
  await waitFor(() => text().includes("후기 목록을 불러오는 중"), "목록 로딩");
  check(!text().includes("등록된 서비스 후기가 없습니다"), "목록 로딩을 빈 후기와 구분");
  hold = ""; release(); await ready();
  check(document.querySelectorAll("tbody tr").length === 4 && row("중립 후기 원문").textContent.includes("중립"), "서버 후기 원문·감정과 정렬을 그대로 표시");
  check(document.querySelector('[aria-label="후기 평가 상태"]').disabled && text().includes("평가 불일치 · 연결 준비") && !text().includes("평가 불일치 0건"), "불일치 필드 누락을 정상·0건으로 추정하지 않고 연결 준비 표시");
  check(!calls.some((item) => item.method === "post"), "목록을 열기만 해서는 감정 분석 POST를 호출하지 않음");
  check(row("중립 후기 원문").textContent.includes("9/10점") && row("수정된 후기 원문").textContent.includes("분석 대기"), "평점과 분석 상태를 별도로 표시 (높은 평점도 pending 유지)");
  check(row("작성된 내용이 없습니다").textContent.includes("정보 없음") && !row("작성된 내용이 없습니다").textContent.includes("분석하기"), "누락 관계·평점·작성일과 noText 안내, 분석 버튼 없음");
  check(row("중립 후기 원문").textContent.includes("2026-10-14 15:53"), "ISO 날짜·시간 표시");
  row("보호자가 작성한").querySelector("button").click(); await sleep();
  check(dialog().textContent.includes(fullText) && dialog().textContent.includes("긍정"), "상세 창에서 생략 없는 원문과 저장된 감정 표시");
  check(dialog().querySelector('[aria-label="만족도 10/10점, 별 5/5개"]'), "기존 평점 컴포넌트 재사용");
  check(!dialog().textContent.includes("이 후기 분석하기"), "이미 analyzed인 후기를 자동 재분석하지 않음");
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await sleep();
  check(!dialog(), "상세 창 ESC 닫기");
  change(search(), "요양보호사 B"); await sleep();
  check(document.querySelectorAll("tbody tr").length === 1 && row("수정된 후기 원문"), "요양보호사 이름 검색");
  change(search(), "중립 후기"); await sleep();
  check(document.querySelectorAll("tbody tr").length === 1 && row("중립 후기 원문"), "후기 내용 검색");
  change(sentiment(), "매우 부정"); await sleep();
  check(text().includes("검색 조건에 맞는 후기가 없습니다") && !text().includes("등록된 서비스 후기가 없습니다"), "필터 검색 결과 0건을 실제 빈 목록과 구분");
  await click("검색 조건 초기화");
  change(state(), "noText"); await sleep();
  check(document.querySelectorAll("tbody tr").length === 1 && row("작성된 내용이 없습니다"), "내용 없음 상태 필터");
  await click("검색 조건 초기화");
  change(state(), "pending"); await sleep();
  const beforeReads = callCount("/api/ai/reviews");
  const beforeStats = callCount("/api/ai/reviews/stats");
  await click("후기·통계 새로고침");
  await waitFor(() => button("후기·통계 새로고침") && !button("후기·통계 새로고침").disabled, "새로고침");
  check(state().value === "pending" && row("수정된 후기 원문") && callCount("/api/ai/reviews") === beforeReads + 1 && callCount("/api/ai/reviews/stats") === beforeStats + 1, "목록·통계 새로고침 후 검색 조건 유지");
  row("수정된 후기 원문").querySelector("button").click(); await sleep();
  check(dialog().textContent.includes("이전 감정 결과는 표시하지 않습니다") && !dialog().textContent.includes("✨ 긍정"), "수정된 pending 후기에 과거 감정을 표시하지 않음");
  hold = "/api/ai/reviews/analyze";
  const singleReads = callCount("/api/ai/reviews");
  const singleStats = callCount("/api/ai/reviews/stats");
  await click("이 후기 분석하기");
  const singleCount = callCount(hold);
  [...document.querySelectorAll("button")].filter((item) => item.textContent === "분석 중..." || item.textContent === "미분석 후기 분석").forEach((item) => item.click()); await sleep();
  check(callCount(hold) === singleCount && button("미분석 후기 분석").disabled && dialog().querySelector('[aria-label="닫기"]').disabled, "단건 분석 중 중복 요청·다른 분석·모달 닫기 차단");
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await sleep();
  check(dialog(), "분석 중 ESC로 모달이 닫히지 않음");
  hold = ""; release();
  await waitFor(() => dialog()?.textContent.includes("분석을 완료했습니다") && !dialog().querySelector('[aria-label="닫기"]').disabled, "분석 완료");
  const single = calls.find((item) => item.path === "/api/ai/reviews/analyze");
  check(single.params.reviewNo === 2 && Object.keys(single.body).length === 0, "선택한 후기의 reviewNo를 query로 전달하며 빈 body 사용");
  check(dialog().textContent.includes("✨ 부정") && callCount("/api/ai/reviews") === singleReads + 1 && callCount("/api/ai/reviews/stats") === singleStats + 1, "분석 후 목록·통계 1회씩 갱신하고 열린 상세에 최신 감정 반영");
  check(state().value === "pending" && text().includes("검색 조건에 맞는 후기가 없습니다"), "분석 후 상태 필터 유지 및 분석된 행 제외");
  await click("닫기");
  reviews = fixtures.map((item) => ({ ...item }));
  await mount(); await ready();
  const batchReads = callCount("/api/ai/reviews");
  const batchStats = callCount("/api/ai/reviews/stats");
  hold = "/api/ai/reviews/analyze-pending";
  await click("미분석 후기 분석");
  check(button("분석하기").disabled && button("후기·통계 새로고침").disabled, "묶음 분석 중 행별 분석과 전체 새로고침 차단");
  hold = ""; release();
  await waitFor(() => row("수정된 후기 원문")?.textContent.includes("부정") && text().includes("성공 1건 · 실패 0건"), "묶음 분석 완료");
  check(callCount("/api/ai/reviews") === batchReads + 1 && callCount("/api/ai/reviews/stats") === batchStats + 1, "미분석 묶음 분석 후 목록·통계 동기화");
  reviews = fixtures.map((item) => ({ ...item })); failBatch = true;
  await mount(); await ready();
  await click("미분석 후기 분석");
  await waitFor(() => text().includes("성공 0건 · 실패 1건") && row("수정된 후기 원문")?.textContent.includes("분석 실패"), "묶음 실패 상태");
  check(!row("수정된 후기 원문").textContent.includes("✨ 중립"), "묶음 분석 실패 항목은 실패 배지로 표시하고 중립으로 바꾸지 않음");
  change(state(), "failed"); await sleep();
  check(document.querySelectorAll("tbody tr").length === 1 && row("수정된 후기 원문"), "이번 화면 분석 실패 필터로 실패 후기만 조회");
  failBatch = false;
  for (const code of [400, 403, 404, 502]) {
    reviews = fixtures.map((item) => ({ ...item })); failure = null;
    await mount(); await ready();
    failure = { path: "/api/ai/reviews/analyze", code };
    await click("분석하기");
    await waitFor(() => text().includes(`(${code})`) && row("수정된 후기 원문"), `분석 오류 ${code}`);
    check(row("수정된 후기 원문").textContent.includes("분석 실패") && !text().includes("분석을 완료했습니다"), `${code} 분석 실패를 성공이나 중립으로 대체하지 않음`);
  }
  failure = null; mutation = "false";
  await click("분석하기");
  await waitFor(() => text().includes("응답 형식이 올바르지"), "false 분석");
  check(row("수정된 후기 원문").textContent.includes("분석 실패"), "HTTP 200 boolean false를 단건 성공으로 처리하지 않음");
  mutation = "mismatch";
  await click("분석하기");
  await waitFor(() => !button("분석 중..."), "다른 후기 응답");
  check(text().includes("응답 형식이 올바르지") && row("수정된 후기 원문").textContent.includes("분석 실패"), "다른 reviewNo 응답을 선택한 후기 결과로 표시하지 않음");
  mutation = "ok"; cached = true; failReload = true;
  await click("분석하기");
  await waitFor(() => text().includes("HTTP 500") && text().includes("저장된 분석 결과를 확인했습니다"), "목록 갱신 실패");
  check(!document.querySelector("tbody") && !text().includes("등록된 서비스 후기가 없습니다"), "분석 성공과 이후 목록 갱신 실패를 구분하고 오래된 행을 숨김");
  failure = null; failReload = false;
  await click("후기 목록 다시 불러오기"); await ready();
  check(row("수정된 후기 원문").textContent.includes("부정"), "목록 재시도로 실제 응답 감정 복구");
  for (const code of [403, 404, 502, null]) {
    failure = { path: "/api/ai/reviews", code };
    await mount();
    await waitFor(() => text().includes(code ? `(${code})` : "서버와 통신하지 못했습니다"), `목록 오류 ${code}`);
    check(!text().includes("등록된 서비스 후기가 없습니다") && button("후기 목록 다시 불러오기"), `${code || "통신"} 목록 오류와 데이터 없음 구분·재시도 제공`);
  }
  failure = null; invalidList = true;
  await mount();
  await waitFor(() => text().includes("응답 형식이 올바르지"), "잘못된 목록");
  check(!text().includes("등록된 서비스 후기가 없습니다"), "배열이 아닌 목록 응답을 오류로 처리");
  invalidList = false; reviews = [];
  await mount();
  await waitFor(() => text().includes("등록된 서비스 후기가 없습니다"), "실제 빈 배열");
  check(button("미분석 후기 분석").disabled, "실제 빈 목록·0건 통계에서 분석 버튼 비활성화");
  reviews = fixtures.map((item) => ({ ...item }));
  await mount(); await ready();
  hold = "/api/ai/reviews/analyze-pending";
  await click("미분석 후기 분석");
  const beforeLeaveList = callCount("/api/ai/reviews");
  const beforeLeaveStats = callCount("/api/ai/reviews/stats");
  root.render(null); await sleep();
  hold = ""; release(); await sleep(); await sleep();
  check(callCount("/api/ai/reviews") === beforeLeaveList && callCount("/api/ai/reviews/stats") === beforeLeaveStats, "화면을 떠난 뒤 늦은 분석 응답으로 목록·통계를 다시 요청하지 않음");
  check(calls.filter((item) => item.path.startsWith("/api/ai")).every((item) => item.credentials === true), "모든 후기 AI API에 withCredentials=true");
  check(!calls.some((item) => ["put", "delete"].includes(item.method)), "서비스 후기 화면에서 후기 수정·삭제 요청 없음");
  withMismatchStats = true;
  reviews = fixtures.map((item) => ({ ...item, ratingSentimentMismatch: false, mismatchReason: null }));
  reviews[0] = { ...reviews[0], rating: 1, sentiment: "매우 긍정", ratingSentimentMismatch: true, mismatchReason: "낮은 평점과 긍정적인 후기 내용이 일치하지 않습니다." };
  reviews[1] = { ...reviews[1], rating: 10, sentiment: "매우 부정", ratingSentimentMismatch: true, mismatchReason: "높은 평점과 부정적인 후기 내용이 일치하지 않습니다." };
  reviews[2] = { ...reviews[2], rating: 10, sentiment: "매우 긍정", analysisStatus: "analyzed", analyzedAt: "2026-10-14T18:00:00" };
  await mount(); await ready();
  check(row("보호자가 작성한").textContent.includes("1/10점") && row("보호자가 작성한").textContent.includes("매우 긍정") && row("보호자가 작성한").textContent.includes("⚠ 검토 필요"), "1/10점·매우 긍정은 서버의 불일치 표시만 추가하고 감정 유지");
  check(row("중립 후기 원문").textContent.includes("10/10점") && row("중립 후기 원문").textContent.includes("매우 부정") && row("중립 후기 원문").textContent.includes("⚠ 검토 필요"), "10/10점·매우 부정의 검토 필요 배지 표시");
  check(!row("수정된 후기 원문").textContent.includes("검토 필요"), "10/10점·매우 긍정의 정상 조합에는 경고 없음");
  check(text().includes("전체 후기4건") && text().includes("분석된 후기3건") && text().includes("2건 · 66.7%"), "불일치 후기도 원래 감정 통계에 포함");
  const warningButton = [...row("보호자가 작성한").querySelectorAll("button")].find((item) => item.textContent === "⚠ 검토 필요");
  check(warningButton.title === reviews[0].mismatchReason, "경고 배지 마우스 오버 사유는 서버 응답 사용");
  warningButton.click(); await sleep();
  check(dialog().textContent.includes(reviews[0].mismatchReason) && dialog().textContent.includes(fullText), "모바일 경고 클릭으로 상세 사유와 원문 함께 확인");
  await click("닫기");
  const mismatchReads = callCount("/api/ai/reviews");
  document.querySelector('a[href="/admin/reviews?mismatch=true"]').click(); await sleep();
  check(document.querySelector('[aria-label="후기 평가 상태"]').value === "mismatch" && document.querySelectorAll("tbody tr").length === 2 && callCount("/api/ai/reviews") === mismatchReads, "불일치 통계 링크가 필터를 적용하며 전체 배열에서 검색");
  change(sentiment(), "매우 긍정"); await sleep();
  check(document.querySelectorAll("tbody tr").length === 1 && row("보호자가 작성한"), "감정 필터와 불일치 필터를 함께 적용");
  await click("후기·통계 새로고침");
  await waitFor(() => !button("후기·통계 새로고침").disabled, "불일치 필터 갱신");
  check(document.querySelector('[aria-label="후기 평가 상태"]').value === "mismatch" && sentiment().value === "매우 긍정" && document.querySelectorAll("tbody tr").length === 1, "목록 갱신 후 불일치·감정 필터 유지");
  await click("검색 조건 초기화");
  check(document.querySelectorAll("tbody tr").length === 4 && document.querySelector('[aria-label="후기 평가 상태"]').value === "all", "불일치 후기는 삭제·숨김 없이 필터 초기화로 복원");
  reviews = reviews.map((item) => ({ ...item, ratingSentimentMismatch: false, mismatchReason: null }));
  await mount(); await ready();
  check(!button("⚠ 검토 필요") && text().includes("평가 불일치 0건"), "서버가 false를 반환하면 평점·감정을 보고 프론트에서 불일치를 추정하지 않음");
  withMismatchStats = false; reviews = fixtures.map((item) => ({ ...item }));
  await mount("/admin/reviews?mismatch=true"); await ready();
  check(document.querySelector('[aria-label="후기 평가 상태"]').disabled && text().includes("현재는 전체 후기를 표시합니다") && document.querySelectorAll("tbody tr").length === 4, "불일치 필드 없는 이전 응답에서도 링크 접근을 0건 검색 결과로 오인하지 않음");
  reviews = fixtures.map((item) => ({ ...item })); failure = null;
  await mount(); await ready();
  check(document.documentElement.scrollWidth <= window.innerWidth && document.querySelector("table").parentElement.classList.contains("overflow-x-auto"), "모바일·PC에서 표는 내부 스크롤, 페이지 가로 넘침 없음");
  row("보호자가 작성한").querySelector("button").click(); await sleep();
  const bounds = dialog().getBoundingClientRect();
  check(bounds.left >= 0 && bounds.right <= window.innerWidth && bounds.height <= window.innerHeight, "원문 상세 모달이 화면 안에 표시");
  await click("닫기");
  window.serviceReviewsTestResult = { passed, count: passed.length, viewport: window.innerWidth, mode: "mock browser (실제 인증·Gemini·DB 변경 미검증)" };
}
run().catch((error) => {
  document.getElementById("results").textContent += `\n실패: ${error.message}`;
  window.serviceReviewsTestResult = { passed, error: error.message };
});
