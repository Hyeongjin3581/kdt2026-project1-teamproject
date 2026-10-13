import { useRef, useState } from "react";
import axios from "axios";
import ReviewDialog from "../../../components/common/ReviewDialog";
import ReviewRating from "../../../components/common/ReviewRating";

export default function GuardianReviewModal({ record, recipient, review, onClose, onSaved }) {
  const isEdit = review != null;
  const [rating, setRating] = useState(review?.rating ?? null);
  const [content, setContent] = useState(review?.reviewContent ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const pending = useRef(false);

  async function save(event) {
    event.preventDefault();
    if (pending.current) return;
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) { setMessage("평점을 1~10점 중에서 선택해주세요."); return; }
    if (content.length > 200) { setMessage("후기 내용은 200자 이하로 입력해주세요."); return; }
    if (record.reportNo == null || record.workStatus !== "완료") { setMessage("완료된 근무기록에만 후기를 작성할 수 있습니다."); return; }
    pending.current = true;
    setBusy(true);
    setMessage("");
    try {
      // NOT NULL 컬럼이므로 내용이 없어도 reviewContent: ""를 전송한다.
      const body = { rating, reviewContent: content.trim() };
      const response = isEdit
        ? await axios.put("/api/review", { ...body, reviewNo: review.reviewNo }, { withCredentials: true })
        : await axios.post("/api/review", { ...body, careworkersReportNo: record.reportNo }, { withCredentials: true });
      if (response.data === true) onSaved(isEdit ? "후기를 수정했습니다." : "후기를 등록했습니다.");
      else setMessage("저장하지 못했습니다. 이미 작성된 후기인지, 로그인 상태와 근무 완료 여부를 확인해주세요.");
    } catch (error) {
      setMessage("후기 저장 요청에 실패했습니다. 서버 연결과 로그인 상태를 확인한 뒤 다시 시도해주세요.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function remove() {
    if (pending.current) return;
    if (!window.confirm("작성한 후기를 삭제하시겠습니까? 삭제한 후기는 복구할 수 없습니다.")) return;
    pending.current = true;
    setBusy(true);
    setMessage("");
    try {
      // 후기 DELETE 컨트롤러는 다른 삭제 API와 달리 @RequestBody를 받는다.
      const response = await axios.delete("/api/review", { data: { reviewNo: review.reviewNo }, withCredentials: true });
      if (response.data === true) onSaved("후기를 삭제했습니다.");
      else setMessage("후기를 삭제하지 못했습니다. 로그인 상태와 작성자 권한을 확인해주세요.");
    } catch (error) {
      setMessage("후기 삭제 요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <ReviewDialog title={isEdit ? "작성한 후기 보기·수정" : "방문 서비스 후기 작성"} busy={busy} onClose={onClose}>
      <form onSubmit={save}>
        <div className="space-y-5 px-6 py-5">
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
            <div><dt className="text-xs text-slate-500">수급자</dt><dd className="mt-1 font-semibold">{recipient.name} 어르신</dd></div>
            <div><dt className="text-xs text-slate-500">담당 요양보호사</dt><dd className="mt-1 font-semibold">{record.cg}</dd></div>
            <div><dt className="text-xs text-slate-500">방문 날짜</dt><dd className="mt-1">{record.iso}</dd></div>
            <div><dt className="text-xs text-slate-500">방문 시간</dt><dd className="mt-1">{record.t}</dd></div>
          </dl>
          <fieldset disabled={busy} className="space-y-3">
            <legend className="text-sm font-bold text-slate-800">서비스 만족도 <span className="text-teal-700">(필수)</span></legend>
            <div className="grid grid-cols-5 gap-2" role="group" aria-label="1~10점 평점 선택">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => <button key={value} type="button" aria-label={`${value}점`} aria-pressed={rating === value} onClick={() => { setRating(value); setMessage(""); }} className={`min-h-10 rounded-lg border py-2 text-sm font-bold disabled:opacity-50 ${rating === value ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 text-slate-600 hover:bg-teal-50"}`}>{value}</button>)}
            </div>
            <ReviewRating rating={rating} />
            <label className="block text-sm font-bold text-slate-800">후기 내용 <span className="text-xs font-normal text-slate-500">(선택, 최대 200자)</span>
              <textarea rows={4} maxLength={200} value={content} onChange={(event) => { setContent(event.target.value); setMessage(""); }} placeholder="방문 서비스에 대한 후기를 남겨주세요." className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
            </label>
            <p className={`text-right text-xs ${content.length > 200 ? "text-rose-600" : "text-slate-400"}`}>{content.length}/200자</p>
          </fieldset>
          {message && <p role="alert" className="text-sm text-rose-600">{message}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-4">
          {isEdit && <button type="button" onClick={remove} disabled={busy} className="rounded-lg border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-600 disabled:opacity-50">후기 삭제</button>}
          <button type="button" onClick={onClose} disabled={busy} className="ml-auto rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold disabled:opacity-50">{isEdit ? "닫기" : "취소"}</button>
          <button type="submit" disabled={busy || rating == null || content.length > 200} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50">{busy ? "처리 중..." : isEdit ? "수정 저장" : "후기 등록"}</button>
        </div>
      </form>
    </ReviewDialog>
  );
}
