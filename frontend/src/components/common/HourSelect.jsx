// 시(hour) 단위 선택 : 백엔드가 시간을 시 단위 정수로 저장하므로 분은 선택하지 않는다.
// value / onChange(event) 는 input 과 같은 모양이라 type="time" 입력을 그대로 바꿔 쓸 수 있다.
const HOURS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

export default function HourSelect({ value, onChange, className = "", ...rest }) {
  const current = `${(value ?? "").slice(0, 2)}:00`; // 분은 버리고 시만 사용
  return (
    <select value={current} onChange={onChange} className={className} {...rest}>
      {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
    </select>
  );
}
