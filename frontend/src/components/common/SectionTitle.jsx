import { useEffect, useState } from "react";
import axios from "axios";
import { TODAY } from "../../constants";
import { useCenter } from "../../context/CenterContext";
import { buildCenters } from "../../utils/adminAdapters";

export default function SectionTitle({ title, subtitle, action }) {
  const center = useCenter();
  const [centers, setCenters] = useState(buildCenters([]));

  // 선택한 센터 이름을 보여주기 위해 센터 목록을 axios로 조회
  useEffect(() => {
    async function loadCenters() {
      try {
        const response = await axios.get("http://localhost:8080/center", { withCredentials: true });
        setCenters(buildCenters(response.data));
      } catch (error) {
        console.error("센터 조회 실패:", error);
      }
    }
    loadCenters();
  }, []);
  const centerName = (id) => centers.find((c) => c.id === id)?.name ?? "전체 센터";
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="mb-1 font-mono text-[10px] font-bold tracking-[.16em] text-teal-600">SCHEDULING · {TODAY.replace(/[()]/g, "").trim()}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${center === "all" ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-teal-50 text-teal-700 ring-teal-200"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${center === "all" ? "bg-slate-400" : "bg-teal-500"}`} />{centerName(center)}
          </span>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
