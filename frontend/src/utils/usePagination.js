import { useMemo, useState } from "react";

// 화면(프론트) 페이징 : 서버에서 받은 전체 목록을 pageSize 개씩 잘라서 보여 준다
//  items     : 검색·필터까지 끝난 전체 목록
//  pageSize  : 한 페이지에 보일 개수
//  resetKeys : 이 값들이 바뀌면 1페이지로 돌아간다 (검색어, 센터, 탭 등)
export function usePagination(items, pageSize, resetKeys = []) {
  const [page, setPage] = useState(1);

  // 검색·필터·탭이 바뀌면 1페이지로 : useEffect 가 아니라 렌더 중에 바로 맞춘다
  // (effect 로 하면 아래 '마지막 페이지로 당기기'와 순서가 꼬여 1페이지가 아닌 마지막 페이지로 갈 수 있음)
  const resetKey = resetKeys.join("|");
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // 삭제 등으로 지금 페이지가 사라지면 마지막 페이지를 보여 준다
  const current = Math.min(page, totalPages);

  // 이번 페이지에 보일 항목만 잘라낸다
  const pageItems = useMemo(() => items.slice((current - 1) * pageSize, current * pageSize), [items, current, pageSize]);

  return { page: current, setPage, totalPages, pageItems, total: items.length };
}
