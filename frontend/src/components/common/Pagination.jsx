//
// 페이지 버튼 줄 : 전체 N건 · ‹ 이전  1 … 4 [5] 6 … 12  다음 ›
// page / totalPages / total 은 usePagination 이 돌려준 값, onChange 는 setPage
// plain : 표 아래가 아닌 곳(카드 목록 등)에 둘 때 위쪽 구분선을 빼고 카드 모양으로
export default function Pagination({ page, totalPages, total, onChange, plain = false }) {
  if (totalPages <= 1) return null; // 한 페이지뿐이면 숨김

  // 보여 줄 번호 : 처음 · 끝 · 지금 페이지 앞뒤 1개, 사이가 벌어지면 "…"
  const numbers = [];
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= 1) numbers.push(n);
    else if (numbers[numbers.length - 1] !== "…") numbers.push("…");
  }

  const go = (n) => {
    if (n < 1 || n > totalPages || n === page) return;
    onChange(n);
    window.scrollTo({ top: 0, behavior: "smooth" }); // 페이지를 넘기면 목록 맨 위부터 보이게
  };

  const arrow = "rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 ${plain ? "rounded-xl border border-slate-200/80 bg-white" : "border-t border-slate-100"}`}>
      <p className="text-xs text-slate-400">전체 <b className="text-slate-600">{total}</b>건 · {page} / {totalPages} 페이지</p>
      <nav className="flex items-center gap-1" aria-label="페이지 이동">
        <button type="button" onClick={() => go(page - 1)} disabled={page === 1} className={arrow}>‹ 이전</button>
        {numbers.map((n, i) => n === "…"
          ? <span key={`gap-${i}`} className="px-1.5 text-xs text-slate-300">…</span>
          : <button key={n} type="button" onClick={() => go(n)} aria-current={n === page ? "page" : undefined}
              className={`min-w-8 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold transition ${n === page ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"}`}>{n}</button>)}
        <button type="button" onClick={() => go(page + 1)} disabled={page === totalPages} className={arrow}>다음 ›</button>
      </nav>
    </div>
  );
}
