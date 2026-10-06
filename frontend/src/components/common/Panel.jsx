//
export default function Panel({ children, className = "" }) {
  return <section className={`rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,42,32,.04)] ${className}`}>{children}</section>;
}
