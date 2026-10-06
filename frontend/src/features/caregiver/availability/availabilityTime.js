// 사용자 확정 규칙: DB는 시(0~24), UI는 자정부터의 분(0~1440)입니다.
// 예: 09:00~11:00 → startTime: 9, endTime: 11, status: "가능".
export const defaultAvailabilityStatus = "가능";

export function uiTimeToBackendValue(minutes) {
  return Number.isInteger(minutes) && minutes >= 0 && minutes <= 1440 && minutes % 60 === 0 ? minutes / 60 : null;
}

export function backendValueToUiTime(value) {
  return Number.isInteger(value) && value >= 0 && value <= 24 ? value * 60 : null;
}

export function isUiTimeRange(start, end) {
  return Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end <= 1440 && start < end;
}

export function formatUiTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

const availabilityTime = { uiTimeToBackendValue, backendValueToUiTime };
export default availabilityTime;
