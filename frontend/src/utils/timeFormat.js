//
// 백엔드의 시간 값은 정수(HHMMSS, 예: 90000 = 09:00:00, 130000 = 13:00:00) 로 온다.
// 예전 형식("09:00:00" 문자열, [9, 0] 배열)도 함께 받아서 "HH:MM" 으로 통일한다.
const pad = (n) => String(n).padStart(2, "0");

export const toHhmm = (t) => {
  if (t === null || t === undefined || t === "") return "";
  if (Array.isArray(t)) return `${pad(t[0] ?? 0)}:${pad(t[1] ?? 0)}`;
  const text = String(t);
  if (text.includes(":")) return text.slice(0, 5);
  const n = Number(text);
  if (n <= 24) return `${pad(n)}:00`;                                   // 시(hour)만 저장된 값 : 9 -> 09:00
  if (n < 10000) { const d = text.padStart(4, "0"); return `${d.slice(0, 2)}:${d.slice(2, 4)}`; } // HHMM : 930 -> 09:30
  const digits = text.padStart(6, "0");                                 // HHMMSS : 90000 -> 09:00
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

// 화면의 "HH:MM" 을 백엔드가 받는 정수(시 단위, 예: "09:00" -> 9)로 바꾼다. 비어 있으면 null
export const toServerTime = (hhmm) => {
  if (!hhmm) return null;
  return Number(toHhmm(hhmm).split(":")[0]);
};
