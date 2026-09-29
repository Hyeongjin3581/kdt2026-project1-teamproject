// 요양보호사 목록
export const caregivers = [
  { id: 1, name: "박영희", gender: "여", area: "안산 본오·고잔", days: "월~금", week: 38, month: 42, status: "정상", tone: "ok", center: "ansan" },
  { id: 2, name: "김미영", gender: "여", area: "안산 고잔", days: "월·화·목·금", week: 31, month: 33, status: "정상", tone: "ok", center: "ansan" },
  { id: 3, name: "이정숙", gender: "여", area: "안산 사동", days: "월~토", week: 48, month: 51, status: "주의", tone: "warning", center: "ansan" },
  { id: 4, name: "최영자", gender: "여", area: "시흥 정왕", days: "화·수·목", week: 22, month: 24, status: "정상", tone: "ok", center: "siheung" },
  { id: 5, name: "한소영", gender: "여", area: "안산 원곡", days: "월~금", week: 52, month: 55, status: "초과 위험", tone: "danger", center: "ansan" },
  { id: 6, name: "정미란", gender: "여", area: "수원 영통", days: "수·목·금", week: 18, month: 20, status: "정상", tone: "ok", center: "suwon" },
  { id: 7, name: "오은주", gender: "여", area: "시흥 배곧", days: "월·수·금", week: 26, month: 28, status: "정상", tone: "ok", center: "siheung" },
  { id: 8, name: "강수진", gender: "여", area: "수원 권선", days: "화·목", week: 20, month: 22, status: "정상", tone: "ok", center: "suwon" },
];

// 요양보호사 근무 기록 (근무 기록 보기)
export const caregiverRecords = {
  1: [
    ["09.17 (수)", "김순자", "13:00~16:00", "3h", "ok"],
    ["09.17 (수)", "김순자", "09:00~12:00", "3h", "ok"],
    ["09.15 (월)", "김순자", "09:00~12:00", "3h", "ok"],
    ["09.12 (금)", "이정자", "13:00~16:00", "3h", "ok"],
  ],
  5: [
    ["09.17 (수)", "박순자", "10:00~12:00", "2h", "ok"],
    ["09.16 (화)", "정영옥", "09:00~11:00", "2h", "warning"],
    ["09.15 (월)", "박순자", "10:00~12:00", "2h", "ok"],
    ["09.13 (토)", "김점례", "14:00~17:00", "3h", "ok"],
  ],
};
