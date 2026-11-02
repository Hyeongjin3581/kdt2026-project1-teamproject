//
// 온케어 로고 마크 (public/oncare-mark.png : 온케어 스케줄 로고의 집·달력 아이콘)
export default function AppMark({ size = "h-9 w-9 text-lg" }) {
  return (
    <div className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm`}>
      <img src="/oncare-mark.png" alt="온케어" className="h-full w-full object-contain" />
    </div>
  );
}
