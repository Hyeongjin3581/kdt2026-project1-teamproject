// "HH:MM" → 분(minute) 변환
export const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

// 같은 셀 안에서 시간이 겹치는 방문 인덱스 집합 반환 (동일 요양보호사 시간 충돌 감지)
export function conflictSet(visits) {
  const ranges = visits.map((v) => { const [s, e] = v.t.split("~"); return [toMin(s), toMin(e)]; });
  const bad = new Set();
  for (let i = 0; i < ranges.length; i++)
    for (let j = i + 1; j < ranges.length; j++)
      if (ranges[i][0] < ranges[j][1] && ranges[j][0] < ranges[i][1]) { bad.add(i); bad.add(j); }
  return bad;
}
