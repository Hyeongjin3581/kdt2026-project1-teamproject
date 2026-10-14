//
// 오늘부터 count 일(오늘 포함)을 신청·문의할 수 있는 날짜 목록으로 만든다.
// startOffset : 며칠 뒤부터 시작할지 (0 = 오늘부터, 1 = 내일부터)
// [{ iso: "2026-10-06", label: "10/6", day: "화", today: true }, ...]
const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
const pad2 = (n) => String(n).padStart(2, "0");

export const upcomingDates = (count = 7, startOffset = 0) => Array.from({ length: count }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + startOffset + i);
  return { iso: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`, label: `${d.getMonth() + 1}/${d.getDate()}`, day: DAY_KR[d.getDay()], today: startOffset + i === 0 };
});
