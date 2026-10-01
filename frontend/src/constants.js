export const TODAY = new Intl.DateTimeFormat("ko-KR", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	weekday: "short",
}).format(new Date());
export const WEEK_LIMIT = 52;
// 방문 일정 · 자동편성 화면이 기준으로 삼는 주(월요일 시작)
export const WEEK_START = "2026-09-21";
