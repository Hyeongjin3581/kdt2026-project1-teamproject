//
import { useState } from "react";

// centers : AdminApp 이 axios(GET /center)로 조회해서 내려주는 센터 목록
export default function CenterSelect({ centers, center, setCenter, dark = false }) {
  const [open, setOpen] = useState(false);
  const cur = centers.find((c) => c.id === center) ?? centers[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition ${dark ? "bg-white/10 text-white hover:bg-white/15" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${center === "all" ? (dark ? "bg-slate-400" : "bg-slate-400") : "bg-teal-400"}`} />
        <span className="flex-1 truncate">{cur.name}</span>
        <span className={dark ? "text-teal-300" : "text-slate-400"}>▾</span>
      </button>
      {open && (
        <div className={`absolute z-30 mt-1 w-full overflow-hidden rounded-lg border shadow-lg ${dark ? "border-white/10 bg-[#0b2c25]" : "border-slate-200 bg-white"}`}>
          {centers.map((c) => (
            <button key={c.id} onMouseDown={() => { setCenter(c.id); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition ${c.id === center ? (dark ? "bg-teal-600 text-white" : "bg-teal-50 font-bold text-teal-700") : dark ? "text-slate-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-50"}`}>
              <span className={`h-2 w-2 shrink-0 rounded-full ${c.id === "all" ? "bg-slate-400" : "bg-teal-400"}`} />{c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
