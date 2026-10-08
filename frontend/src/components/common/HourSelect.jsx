//
// 시(hour) 단위 선택 : 백엔드가 시간을 시 단위 정수로 저장하므로 분은 선택하지 않는다.
// value / onChange(event) 는 input 과 같은 모양이라 type="time" 입력을 그대로 바꿔 쓸 수 있다.
const HOURS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

// minHour ~ maxHour : 고를 수 있는 시간 범위 (기본 0~24). 현재 값이 범위 밖이어도 그 값은 보이도록 남겨 둔다.
export default function HourSelect({ value, onChange, className = "", minHour = 0, maxHour = 24, ...rest }) {
  const current = `${(value ?? "").slice(0, 2)}:00`; // 분은 버리고 시만 사용
  const options = HOURS.filter((h, i) => (i >= minHour && i <= maxHour) || h === current);
  return (
    <select value={current} onChange={onChange} className={className} {...rest}>
      {options.map((h) => <option key={h} value={h}>{h}</option>)}
    </select>
  );
}
