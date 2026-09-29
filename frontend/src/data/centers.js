// 센터 목록 및 이름 조회 유틸
export const centers = [
  { id: "all", name: "전체 센터", short: "전체 센터 통합" },
  { id: "ansan", name: "온케어 안산센터", short: "안산센터" },
  { id: "siheung", name: "온케어 시흥센터", short: "시흥센터" },
  { id: "suwon", name: "온케어 수원센터", short: "수원센터" },
];

export const centerName = (id) => centers.find((c) => c.id === id)?.name ?? "전체 센터";
