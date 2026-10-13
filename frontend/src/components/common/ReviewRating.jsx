// 서버의 1~10점을 그대로 보여 주고, 별 하나는 2점(반 별은 1점)으로 표시한다.
export default function ReviewRating({ rating }) {
  const valid = Number.isInteger(rating) && rating >= 1 && rating <= 10;
  return (
    <span className="inline-flex flex-wrap items-center gap-2" aria-label={valid ? `만족도 ${rating}/10점, 별 ${rating / 2}/5개` : "평점 미선택"}>
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = valid ? Math.min(1, Math.max(0, rating / 2 - index)) : 0;
          return (
            <span key={index} className="relative block h-5 w-5 shrink-0">
              <svg viewBox="0 0 24 24" className="absolute inset-0 h-5 w-5 fill-slate-200"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01Z" /></svg>
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 max-w-none fill-teal-600"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01Z" /></svg>
              </span>
            </span>
          );
        })}
      </span>
      <span aria-hidden="true" className="text-xs font-semibold text-teal-700">{valid ? `${rating}/10점` : "평점을 선택해주세요"}</span>
    </span>
  );
}
