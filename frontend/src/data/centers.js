// 센터 목록 및 이름 조회 유틸
export const centers = [
  { id: "all", name: "전체 센터", short: "전체 센터 통합" },
];

export const centerName = (id) => centers.find((c) => c.id === id)?.name ?? "센터 정보 없음";
