// 방문 일정 · 자동편성 · 결원 관련 mock 데이터

// 대시보드 오늘의 방문 일정
export const todayVisits = [
  { t: "09:00~12:00", name: "김순자", area: "안산시 본오동", cg: "박영희", center: "ansan" },
  { t: "10:00~12:00", name: "박순자", area: "안산시 원곡동", cg: "한소영", center: "ansan" },
  { t: "13:00~16:00", name: "이정자", area: "안산시 고잔동", cg: "김미영", center: "ansan" },
  { t: "14:00~17:00", name: "최순희", area: "시흥시 정왕동", cg: "최영자", center: "siheung" },
  { t: "09:00~11:00", name: "정영옥", area: "수원시 영통동", cg: "정미란", center: "suwon" },
];

// 방문 일정: 요양보호사(행) × 요일(열) 주간 타임테이블 — 셀마다 여러 방문이 시간순으로 누적될 수 있음
export const scheduleDays = ["월 21", "화 22", "수 23", "목 24", "금 25", "토 26"];

export const weekTable = [
  { cg: "박영희", center: "ansan", cells: [
    [{ t: "09:00~12:00", name: "김순자", area: "본오동" }, { t: "14:00~17:00", name: "이정자", area: "고잔동" }, { t: "18:00~20:00", name: "박순자", area: "원곡동" }],
    [], [{ t: "13:00~16:00", name: "김순자", area: "본오동" }], [], [{ t: "09:00~12:00", name: "김순자", area: "본오동" }], [],
  ] },
  { cg: "김미영", center: "ansan", cells: [
    // 이정숙과 같은 14~17시대지만 서로 다른 수급자를 맡으므로 정상 (충돌 아님)
    [{ t: "15:00~17:00", name: "김점례", area: "사동" }], [{ t: "13:00~16:00", name: "이정자", area: "고잔동" }], [], [{ t: "13:00~16:00", name: "이정자", area: "고잔동" }], [], [],
  ] },
  { cg: "이정숙", center: "ansan", cells: [
    [{ t: "14:00~17:00", name: "한말순", area: "사동" }], [], [{ t: "14:00~17:00", name: "한말순", area: "사동" }], [], [{ t: "14:00~17:00", name: "한말순", area: "사동" }], [{ t: "10:00~12:00", name: "김점례", area: "사동" }],
  ] },
  { cg: "한소영", center: "ansan", cells: [
    [{ t: "10:00~12:00", name: "박순자", area: "원곡동" }], [], [{ t: "10:00~12:00", name: "박순자", area: "원곡동" }], [], [{ t: "10:00~12:00", name: "박순자", area: "원곡동" }], [],
  ] },
  { cg: "최영자", center: "siheung", cells: [
    [{ t: "14:00~17:00", name: "최순희", area: "정왕동" }], [], [{ t: "14:00~17:00", name: "최순희", area: "정왕동" }], [], [{ t: "14:00~17:00", name: "최순희", area: "정왕동" }], [],
  ] },
  { cg: "오은주", center: "siheung", cells: [
    [{ t: "09:00~11:00", name: "한말순", area: "배곧동" }], [], [{ t: "09:00~11:00", name: "한말순", area: "배곧동" }], [], [{ t: "09:00~11:00", name: "한말순", area: "배곧동" }], [],
  ] },
  { cg: "정미란", center: "suwon", cells: [
    [], [{ t: "09:00~11:00", name: "정영옥", area: "영통동" }], [], [{ t: "09:00~11:00", name: "정영옥", area: "영통동" }], [], [],
  ] },
  { cg: "강수진", center: "suwon", cells: [
    [], [{ t: "14:00~16:00", name: "송복순", area: "권선동" }], [], [{ t: "14:00~16:00", name: "송복순", area: "권선동" }], [], [],
  ] },
];

// 자동편성 배정 초안
export const assignments = [
  { recipient: "김순자", date: "09.21 (월)", time: "09:00~12:00", cg: "박영희", score: 94, state: "assigned", center: "ansan", reasons: ["필수조건 통과", "활동지역 적합도 96점", "최근 30일 업무량 가점"] },
  { recipient: "이정자", date: "09.22 (화)", time: "13:00~16:00", cg: "김미영", score: 88, state: "assigned", center: "ansan", reasons: ["필수조건 통과", "활동지역 적합도 90점", "최근 30일 업무량 가점"] },
  { recipient: "박순자", date: "09.23 (수)", time: "10:00~12:00", cg: "이정숙", score: 71, state: "review", center: "ansan", reasons: ["필수조건 통과", "활동지역 적합도 82점", "최근 30일 업무량 감점", "주 52시간 기준 근접"] },
  { recipient: "최순희", date: "09.21 (월)", time: "14:00~17:00", cg: "최영자", score: 85, state: "assigned", center: "siheung", reasons: ["필수조건 통과", "활동지역 적합도 88점", "최근 30일 업무량 가점"] },
  { recipient: "한말순", date: "09.22 (화)", time: "09:00~11:00", cg: "오은주", score: 82, state: "assigned", center: "siheung", reasons: ["필수조건 통과", "활동지역 적합도 84점", "최근 30일 업무량 가점"] },
  { recipient: "송복순", date: "09.22 (화)", time: "14:00~16:00", cg: "강수진", score: 80, state: "assigned", center: "suwon", reasons: ["필수조건 통과", "활동지역 적합도 81점", "최근 30일 업무량 보정"] },
  { recipient: "정영옥", date: "09.24 (목)", time: "09:00~11:00", cg: "미배정", score: 0, state: "unassigned", center: "suwon", reasons: ["해당 시간 가용 요양보호사 없음", "인접 지역 인력 배정 검토 필요"] },
];

export const stateMeta = {
  assigned: { tone: "ok", label: "자동배정 완료" },
  review: { tone: "warning", label: "확인 필요" },
  unassigned: { tone: "danger", label: "미배정" },
};

// 결원 캘린더 + 대체자 추천
export const vacancyEvents = [
  {
    date: 23, kind: "vacancy", count: 2, center: "ansan", recipient: "김순자", cg: "박영희", dateLabel: "9월 23일 (수)", time: "14:00~17:00", area: "안산시 본오동",
    reason: "박영희 요양보호사 · 개인 사정 (당일 결근)", deadline: "오늘 18:00까지 응답 · 약 6시간 남음",
    subs: [
      { name: "김미영", score: 92, km: "2.1km", avail: "근무 가능", conflict: "해당 시간 일정 없음", week: "31h", reasons: ["현재 일정 없음", "수급자 지역과 가까움", "해당 시간 근무 가능", "주간 근무시간 여유"] },
      { name: "이정숙", score: 84, km: "4.6km", avail: "근무 가능", conflict: "일정 없음", week: "48h", reasons: ["수급자 지역과 인접", "해당 시간 근무 가능", "주 52시간 근접 주의"] },
      { name: "최영자", score: 76, km: "8.3km", avail: "근무 가능", conflict: "일정 없음", week: "22h", reasons: ["이동 거리 다소 김", "해당 시간 근무 가능", "근무시간 여유"] },
    ],
  },
  {
    date: 24, kind: "unassigned", count: 1, center: "suwon", recipient: "정영옥", cg: "미배정", dateLabel: "9월 24일 (목)", time: "09:00~11:00", area: "수원시 영통동",
    reason: "자동편성 미배정 · 해당 시간 가용 인력 부족", deadline: "9월 23일 18:00까지 배정 권장",
    subs: [
      { name: "정미란", score: 89, km: "1.8km", avail: "근무 가능", conflict: "일정 없음", week: "18h", reasons: ["현재 일정 없음", "수급자 지역과 매우 가까움", "군포 지역 활동 가능", "근무시간 여유"] },
      { name: "이정숙", score: 72, km: "6.9km", avail: "근무 가능", conflict: "일정 없음", week: "48h", reasons: ["인접 지역 활동", "주 52시간 근접 주의"] },
    ],
  },
  {
    date: 25, kind: "vacancy", count: 1, center: "ansan", recipient: "이정자", cg: "김미영", dateLabel: "9월 25일 (금)", time: "13:00~16:00", area: "안산시 고잔동",
    reason: "김미영 요양보호사 · 병원 진료 (사전 신청)", deadline: "9월 24일 18:00까지 응답",
    subs: [
      { name: "박영희", score: 90, km: "2.9km", avail: "근무 가능", conflict: "일정 없음", week: "38h", reasons: ["현재 일정 없음", "수급자 지역과 가까움", "해당 시간 근무 가능", "근무시간 여유"] },
      { name: "한소영", score: 61, km: "3.4km", avail: "제한", conflict: "주 52시간 초과 위험", week: "52h", reasons: ["지역 가까움", "주 52시간 도달 · 추가 배정 불가"] },
    ],
  },
];
