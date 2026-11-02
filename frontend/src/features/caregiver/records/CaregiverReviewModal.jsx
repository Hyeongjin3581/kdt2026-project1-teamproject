import ReviewDialog from "../../../components/common/ReviewDialog";
import ReviewRating from "../../../components/common/ReviewRating";

// 받은 후기는 조회만 하며 변경 API를 호출하지 않는다.
export default function CaregiverReviewModal({ record, review, onClose }) {
  return (
    <ReviewDialog title="방문 서비스 후기" onClose={onClose}>
      <div className="space-y-5 px-6 py-5">
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
          <div><dt className="text-xs text-slate-500">수급자</dt><dd className="mt-1 font-semibold">{record.recipientName}</dd></div>
          <div><dt className="text-xs text-slate-500">방문 날짜</dt><dd className="mt-1">{record.iso}</dd></div>
          <div><dt className="text-xs text-slate-500">방문 시간</dt><dd className="mt-1">{record.time}</dd></div>
          <div><dt className="text-xs text-slate-500">근무 상태</dt><dd className="mt-1">방문 완료</dd></div>
          <div className="col-span-2"><dt className="text-xs text-slate-500">요청 내용</dt><dd className="mt-1 whitespace-pre-wrap break-words">{record.content || "-"}</dd></div>
        </dl>
        <div><h3 className="mb-2 text-sm font-bold text-slate-800">서비스 만족도</h3><ReviewRating rating={review.rating} /></div>
        <div><h3 className="mb-2 text-sm font-bold text-slate-800">후기 내용</h3><p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{review.reviewContent?.trim() ? review.reviewContent : "작성된 후기 내용이 없습니다."}</p></div>
        <p className="text-xs text-slate-400">작성일: {typeof review.createDate === "string" ? review.createDate.replace("T", " ").slice(0, 16) : "-"}</p>
      </div>
      <div className="flex justify-end border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold">닫기</button></div>
    </ReviewDialog>
  );
}
