import { createContext, useContext } from "react";

// 선택된 센터를 하위 컴포넌트에 전달하는 Context
export const CenterCtx = createContext("all");
export const useCenter = () => useContext(CenterCtx);

// 선택된 센터(sel)에 따라 행(row)을 필터링하는 조건 함수
export const inCenter = (sel) => (row) => sel === "all" || row.center === sel;
