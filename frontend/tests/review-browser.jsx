// 개발 서버에서만 직접 여는 검증 화면. 모의 데이터는 제품 화면/빌드에 포함하지 않는다.
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import GuardianApp from "../src/features/guardian/GuardianApp";
import GuardianRecords from "../src/features/guardian/records/GuardianRecords";
import CaregiverRecords from "../src/features/caregiver/records/CaregiverRecords";
import ReviewRating from "../src/components/common/ReviewRating";
import "../src/index.css";

const root = createRoot(document.getElementById("root"));
const output = document.getElementById("results");
const passed = [];
const calls = [];
const recipients = [
  { careRecipientNo: 11, guardianNo: 7, careRecipientName: "검증 어르신 A" },
  { careRecipientNo: 12, guardianNo: 7, careRecipientName: "검증 어르신 B" },
  { careRecipientNo: 13, guardianNo: 8, careRecipientName: "다른 보호자 수급자" },
];
const requests = [
  { requestNo: 21, carerecipientNo: 11, visitDate: "2026-10-13", visitStartTime: "09:00", visitEndTime: "11:00", requestState: "완료", requestContent: "완료 방문 A" },
  { requestNo: 22, carerecipientNo: 11, visitDate: "2026-10-12", visitStartTime: "09:00", visitEndTime: "11:00", requestState: "완료", requestContent: "실제 근무 미완료" },
  { requestNo: 23, carerecipientNo: 11, visitDate: "2026-10-11", visitStartTime: "09:00", visitEndTime: "11:00", requestState: "완료", requestContent: "근무번호 없음" },
  { requestNo: 24, carerecipientNo: 12, visitDate: "2026-10-10", visitStartTime: "13:00", visitEndTime: "15:00", requestState: "완료", requestContent: "완료 방문 B" },
];
const reports = [
  { careworkersReportNo: 31, requestNo: 21, careworkerNo: 5, workStatus: "완료", workDate: "2026-10-13", workStartTime: "09:00", workEndTime: "11:00" },
  { careworkersReportNo: 32, requestNo: 22, careworkerNo: 5, workStatus: "확정", workDate: "2026-10-12", workStartTime: "09:00", workEndTime: "11:00" },
  { careworkersReportNo: 34, requestNo: 24, careworkerNo: 5, workStatus: "완료", workDate: "2026-10-10", workStartTime: "13:00", workEndTime: "15:00" },
];
let reviews = [];
let listFailure = false;
let mutationResult = true;
let mutationThrows = false;
let releaseMutation = null;
let holdMutation = false;
let delayRecipient = null;
let releaseRecipient = null;
let caregiver = 5;

axios.defaults.adapter = async (config) => {
  const path = new URL(config.url, location.origin).pathname;
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  calls.push({ method: config.method, path, body, credentials: config.withCredentials, params: config.params, signal: config.signal });
  let data;
  if (path === "/guardian") data = [{ guardianNo: 7, userNo: 1 }];
  else if (path === "/carerecipient") data = recipients;
  else if (path === "/api/careworkers") data = [{ careworkerNo: 5, centerNo: 1, careworkerName: "검증 요양보호사" }];
  else if (path === "/request/carerecipient") {
    if (config.params.careRecipientNo === delayRecipient) await new Promise((resolve) => { releaseRecipient = resolve; });
    data = requests.filter((item) => item.carerecipientNo === config.params.careRecipientNo);
  }
  else if (path === "/careworkerreport/center") data = reports;
  else if (path === "/careworkerreport/careworker") data = reports.filter((item) => item.careworkerNo === config.params.careworkerNo);
  else if (path.endsWith("/my")) {
    if (listFailure === true) throw new Error("모의 통신 실패");
    data = listFailure === "invalid" ? {} : path.includes("careworker") && caregiver !== 5 ? [] : reviews.map((review) => ({ ...review }));
  }
  else if (path === "/api/review") {
    if (holdMutation) await new Promise((resolve) => { releaseMutation = resolve; });
    if (mutationThrows) throw new Error("모의 변경 요청 실패");
    data = mutationResult;
    if (data === true) {
      if (config.method === "post") reviews.push({ ...body, reviewNo: 101, guardianNo: 7, createDate: "2026-10-13T15:00:00" });
      if (config.method === "put") reviews = reviews.map((review) => review.reviewNo === body.reviewNo ? { ...review, ...body } : review);
      if (config.method === "delete") reviews = reviews.filter((review) => review.reviewNo !== body.reviewNo);
    }
  }
  else throw new Error(`명세에 없는 테스트 요청: ${path}`);
  return { data, status: 200, statusText: "OK", headers: {}, config };
};

const sleep = () => new Promise((resolve) => setTimeout(resolve, 20));
async function waitFor(predicate, description) {
  for (let i = 0; i < 150; i++) { if (predicate()) return; await sleep(); }
  throw new Error(`대기 실패: ${description}`);
}
function check(value, label) { if (!value) throw new Error(label); passed.push(label); output.textContent = passed.join("\n"); }
const buttons = () => [...document.querySelectorAll("button")];
const button = (text) => buttons().find((item) => item.textContent === text);
async function click(text) { const item = button(text); if (!item) throw new Error(`버튼 없음: ${text}`); item.click(); await sleep(); }
function change(element, value) {
  const prototype = element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : element.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
  element.dispatchEvent(new Event(element.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
}
const dialog = () => document.querySelector('[role="dialog"]');
const mutationCalls = () => calls.filter((call) => call.path === "/api/review");
const guardian = () => <MemoryRouter initialEntries={["/guardian/records"]}><Routes><Route path="/guardian/*" element={<GuardianApp user={{ userNo: 1, userId: "test" }} logout={() => {}} />} /></Routes></MemoryRouter>;
async function unmount() { root.render(null); await sleep(); }

async function run() {
  for (let rating = 1; rating <= 10; rating++) {
    root.render(<ReviewRating rating={rating} />);
    await sleep();
    const fills = [...document.querySelectorAll('span[style]')].map((item) => item.style.width);
    check(fills.length === 5 && fills.filter((width) => width === "100%").length === Math.floor(rating / 2) && fills.filter((width) => width === "50%").length === rating % 2, `${rating}/10점의 채운 별·반 별 정확성`);
  }
  await unmount();
  root.render(guardian());
  await waitFor(() => button("후기 작성"), "보호자 방문기록");
  check(document.querySelectorAll("tbody tr").length === 3 && buttons().filter((item) => item.textContent === "후기 작성").length === 1, "요청 완료만으로 작성 허용하지 않음 (미완료/근무번호 없음 차단)");
  check(document.querySelectorAll("select option").length === 2, "본인 보호자의 수급자만 선택");
  check(document.querySelector("tbody tr").textContent.includes("완료 방문 A"), "방문기록 최신순 유지");
  await click("후기 작성");
  check(button("후기 등록").disabled, "미선택 평점 저장 차단");
  check(document.querySelector("textarea").maxLength === 200, "후기 내용 200자 입력 제한");
  await click("9");
  check(dialog().textContent.includes("9/10점"), "숫자 선택 결과 실시간 표시");
  dialog().querySelector('[aria-label="닫기"]').focus();
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, cancelable: true }));
  check(document.activeElement === button("후기 등록"), "Shift+Tab 초점이 모달 안에서 순환");
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", cancelable: true }));
  check(document.activeElement === dialog().querySelector('[aria-label="닫기"]'), "Tab 초점이 모달 안에서 순환");
  change(document.querySelector("textarea"), "가".repeat(201)); await sleep();
  const overLimitBefore = mutationCalls().length;
  document.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); await sleep();
  check(button("후기 등록").disabled && mutationCalls().length === overLimitBefore, "200자 초과 내용은 요청 단계에서도 차단");
  change(document.querySelector("textarea"), ""); await sleep();
  holdMutation = true;
  const before = mutationCalls().length;
  await click("후기 등록");
  document.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  document.querySelector('[role="dialog"]').parentElement.click();
  await sleep();
  check(mutationCalls().length === before + 1 && dialog() && button("취소").disabled, "중복 등록 및 저장 중 ESC·배경 닫기 차단");
  holdMutation = false; releaseMutation();
  await waitFor(() => button("후기 보기·수정"), "저장 후 목록 재조회");
  const post = mutationCalls().at(-1);
  check(post.body.careworkersReportNo === 31 && post.body.rating === 9 && post.body.reviewContent === "" && post.credentials, "POST 근무번호·정수 평점·빈 문자열·쿠키 옵션");
  await click("후기 보기·수정");
  check(document.querySelector('[aria-label="9점"]').getAttribute("aria-pressed") === "true", "기존 평점 수정 모달에 복원");
  change(document.querySelector("textarea"), "수정 후기"); await sleep(); await click("수정 저장");
  await waitFor(() => !dialog() && button("후기 보기·수정"), "수정 후 갱신");
  await click("후기 보기·수정");
  check(document.querySelector("textarea").value === "수정 후기", "수정 내용 서버 재조회 후 복원");
  change(document.querySelector("textarea"), "   "); await sleep(); await click("수정 저장");
  await waitFor(() => !dialog(), "내용 비운 수정");
  check(mutationCalls().at(-1).method === "put" && mutationCalls().at(-1).body.reviewContent === "", "PUT 공백 내용은 빈 문자열로 전송");
  await click("후기 보기·수정");
  let confirmation = "";
  window.confirm = (text) => { confirmation = text; return false; };
  const deletesBefore = mutationCalls().length;
  await click("후기 삭제");
  check(dialog() && mutationCalls().length === deletesBefore && confirmation.includes("복구할 수 없습니다"), "삭제 확인 취소 시 요청 없음");
  window.confirm = () => true;
  mutationResult = false;
  await click("후기 삭제");
  check(dialog() && dialog().querySelector('[role="alert"]') && reviews.length === 1, "삭제 false 응답 시 모달·후기 유지");
  mutationThrows = true;
  await click("수정 저장");
  check(dialog() && dialog().querySelector('[role="alert"]'), "수정 통신 실패 시 오류 표시 및 모달 유지");
  mutationThrows = false; mutationResult = '"true"'; // JSON 문자열 응답: Axios 변환 후에도 boolean이 아니다.
  await click("수정 저장");
  check(dialog() && dialog().querySelector('[role="alert"]'), "문자열 true는 성공으로 처리하지 않음");
  mutationResult = true;
  await click("후기 삭제");
  await waitFor(() => button("후기 작성"), "삭제 후 재작성");
  check(mutationCalls().at(-1).method === "delete" && mutationCalls().at(-1).body.reviewNo === 101 && !mutationCalls().at(-1).params, "DELETE는 reviewNo를 JSON 본문으로 전송");
  mutationResult = false;
  await click("후기 작성"); await click("8"); await click("후기 등록");
  check(dialog() && dialog().querySelector('[role="alert"]'), "등록 false 응답은 실패로 표시");
  mutationResult = true;
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); await sleep();
  check(!dialog(), "처리 중이 아닐 때 ESC 닫기");
  await click("후기 작성"); dialog().parentElement.click(); await sleep();
  check(!dialog(), "처리 중이 아닐 때 모달 바깥 클릭 닫기");
  change(document.querySelector("select"), "12");
  await waitFor(() => button("후기 작성") && document.querySelector("tbody").textContent.includes("완료 방문 B"), "수급자 B 전환");
  check(!document.querySelector("tbody").textContent.includes("완료 방문 A"), "수급자 전환 후 이전 기록 제거");
  buttons().find((item) => item.textContent.includes("방문 일정")).click(); await sleep();
  buttons().find((item) => item.textContent.includes("방문 기록")).click(); await sleep();
  await waitFor(() => document.querySelector("select")?.value === "12" && button("후기 작성"), "화면 이동 후 선택 유지");
  check(document.querySelector("select").value === "12", "화면 이동 후 부모 수급자 선택 상태 유지");
  delayRecipient = 11;
  change(document.querySelector("select"), "11");
  await waitFor(() => releaseRecipient, "지연된 A 조회");
  check(!document.querySelector("tbody"), "수급자 조회 중 이전 수급자의 표 숨김");
  change(document.querySelector("select"), "12");
  await waitFor(() => button("후기 작성"), "B 재전환");
  delayRecipient = null; releaseRecipient(); await sleep();
  check(!document.querySelector("tbody").textContent.includes("완료 방문 A"), "늦게 도착한 이전 수급자 응답 무시");
  check(calls.some((call) => call.path === "/request/carerecipient" && call.params.careRecipientNo === 11 && call.signal?.aborted), "수급자 전환 시 이전 요청 취소");
  await unmount(); listFailure = true; root.render(guardian());
  await waitFor(() => button("후기 다시 조회"), "조회 오류");
  check(!button("후기 작성"), "후기 API 오류를 빈 목록으로 간주하지 않음");
  listFailure = "invalid"; await click("후기 다시 조회");
  check(button("후기 다시 조회") && !button("후기 작성"), "배열이 아닌 후기 응답 실패 처리");
  listFailure = false; await click("후기 다시 조회");
  await waitFor(() => button("후기 작성"), "후기 재시도 성공");
  check(Boolean(button("후기 작성")), "후기 조회 재시도 복구");
  await unmount(); root.render(<GuardianRecords recipients={[]} />); await sleep();
  check(document.getElementById("root").textContent.includes("연결된 수급자가 없습니다"), "수급자 없음 안내");
  await unmount();
  reviews = [{ reviewNo: 501, careworkersReportNo: 31, rating: 5, reviewContent: "", createDate: "2026-10-13T15:00:00" }, { reviewNo: 31, careworkersReportNo: 999, rating: 10, reviewContent: "연결되면 안 되는 후기" }];
  root.render(<CaregiverRecords careworkerNo={5} />);
  await waitFor(() => button("후기 보기"), "요양보호사 후기");
  check(buttons().filter((item) => item.textContent === "후기 보기").length === 1 && document.querySelector("tbody").textContent.includes("후기 없음"), "근무번호로 매칭, reviewNo 일치만으로 연결하지 않음");
  await click("후기 보기");
  check(dialog().textContent.includes("5/10점") && dialog().textContent.includes("작성된 후기 내용이 없습니다.") && !button("후기 삭제") && !button("수정 저장") && !document.querySelector("textarea"), "요양보호사 읽기 전용·빈 내용·평점 표시");
  const currentMutations = mutationCalls().length;
  await click("닫기");
  change(document.querySelector('input[type="date"]'), "2026-10-10"); await sleep();
  check(document.querySelectorAll("tbody tr").length === 1 && document.querySelector("tbody").textContent.includes("완료 방문 B"), "기존 날짜 필터 유지");
  await click("초기화"); change(document.querySelector('input[type="search"]'), "검증 어르신 A"); await sleep();
  check(document.querySelectorAll("tbody tr").length === 1, "기존 텍스트 검색 유지");
  await click("새로고침"); await waitFor(() => button("후기 보기"), "새로고침 후 필터 유지");
  check(document.querySelector('input[type="search"]').value === "검증 어르신 A", "새로고침 시 검색 조건 유지");
  check(mutationCalls().length === currentMutations, "요양보호사 기능에 변경 API 요청 없음");
  caregiver = 6; root.render(<CaregiverRecords careworkerNo={6} />);
  await waitFor(() => document.getElementById("root").textContent.includes("완료한 방문 기록이 없습니다"), "다른 요양보호사");
  check(!button("후기 보기") && !dialog(), "다른 요양보호사로 전환 시 이전 기록·후기 제거");
  await unmount(); caregiver = 5; listFailure = true; root.render(<CaregiverRecords careworkerNo={5} />);
  await waitFor(() => button("후기 다시 조회"), "요양보호사 후기 실패");
  check(!document.querySelector("tbody").textContent.includes("후기 없음"), "요양보호사 조회 실패와 후기 없음 구분");
  listFailure = false; await click("후기 다시 조회"); await waitFor(() => button("후기 보기"), "요양보호사 재시도");
  await click("후기 보기");
  const box = dialog().getBoundingClientRect();
  check(box.left >= 0 && box.right <= innerWidth && box.height <= innerHeight, "후기 모달이 화면 범위 안에 표시");
  if (innerWidth < 640) check(document.querySelector("table").parentElement.scrollWidth > document.querySelector("table").parentElement.clientWidth, "모바일 기록 표 가로 스크롤 유지");
  else check(document.querySelector("table").getBoundingClientRect().width <= innerWidth, "데스크톱 기록 표 화면 너비 유지");
  check(calls.filter((call) => call.path.startsWith("/api/review")).every((call) => call.credentials === true), "모든 후기 API에 withCredentials 전달");
  window.reviewTestResult = { passed: passed.length, checks: passed };
  output.textContent = `PASS ${passed.length} (모의 API 브라우저 검증)\n${passed.join("\n")}`;
}
run().catch((error) => { window.reviewTestResult = { error: error.stack, passed: passed.length, checks: passed }; output.textContent = `FAIL\n${error.stack}\n${passed.join("\n")}`; });
