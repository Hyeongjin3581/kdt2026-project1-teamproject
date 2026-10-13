import { useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";

// 관리자 알림이 오면 해당 메뉴 화면의 목록을 다시 불러온다.
// AdminApp 이 <Outlet context={{ refreshes }} /> 로 넘겨주는 "메뉴별 새로 불러오기 횟수"가 바뀔 때만 reload 를 실행한다.
// 화면을 처음 열 때는 이미 loadData 가 실행되므로 건너뛴다. (마지막으로 본 횟수를 ref 에 기억해서 비교)
export default function useNotifyRefresh(menu, reload) {
  const { refreshes } = useOutletContext();
  const count = refreshes[menu];
  const seen = useRef(count);

  useEffect(function () {
    if (seen.current === count) return;
    seen.current = count;
    reload();
  }, [count]);
}
