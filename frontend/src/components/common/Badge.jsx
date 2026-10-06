//
export default function Badge({ children, tone = "neutral" }) {
  const tones = {
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-red-200",
    info: "bg-teal-50 text-teal-700 ring-teal-200",
    neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}
