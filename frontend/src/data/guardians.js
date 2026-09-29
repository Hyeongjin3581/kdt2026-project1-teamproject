// 보호자 목록 — 한 보호자는 한 명 이상의 수급자와 연결될 수 있음
export const guardians = [
  {
    name: "이수현", tel: "010-1234-5678", relation: "딸", joined: "2026.03.11", status: "정상", tone: "ok", center: "ansan",
    recipients: [
      { name: "김순자", area: "안산시 본오동", cg: "박영희" },
      { name: "박순자", area: "안산시 원곡동", cg: "한소영" },
    ],
  },
  { name: "김성호", tel: "010-2345-6789", relation: "아들", joined: "2026.04.02", status: "정상", tone: "ok", center: "ansan", recipients: [{ name: "이정자", area: "안산시 고잔동", cg: "김미영" }] },
  {
    name: "박지영", tel: "010-3456-7890", relation: "딸", joined: "2026.05.20", status: "정상", tone: "ok", center: "siheung",
    recipients: [
      { name: "최순희", area: "시흥시 정왕동", cg: "최영자" },
      { name: "한말순", area: "시흥시 배곧동", cg: "오은주" },
    ],
  },
  {
    name: "정민아", tel: "010-4567-8901", relation: "며느리", joined: "2026.09.14", status: "가입 승인", tone: "info", center: "suwon",
    recipients: [
      { name: "정영옥", area: "수원시 영통동", cg: "정미란" },
      { name: "송복순", area: "수원시 권선동", cg: "강수진" },
    ],
  },
];
