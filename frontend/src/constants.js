//
// 앱 전역에서 공유되는 상수
const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
const pad2 = (n) => String(n).padStart(2, "0");
const now = new Date();

// 화면 머리말 등에 쓰는 오늘 날짜 : "2026.10.06 (화)" (실제 컴퓨터 날짜)
export const TODAY = `${now.getFullYear()}.${pad2(now.getMonth() + 1)}.${pad2(now.getDate())} (${DAY_KR[now.getDay()]})`;
export const WEEK_LIMIT = 52;
// 방문 일정 · 자동편성 화면이 기준으로 삼는 주(월요일 시작) : 오늘이 속한 주의 월요일
const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
export const WEEK_START = `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
