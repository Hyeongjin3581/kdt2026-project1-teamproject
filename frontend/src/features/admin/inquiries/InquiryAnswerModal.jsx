import { useEffect, useState } from "react";
import axios from "axios";
import Badge from "../../../components/common/Badge";
import { toHhmm } from "../../../utils/timeFormat";
import { inquiryStatus, assigneeStatus } from "../../../utils/inquiryStatus";

// 읽기 전용 한 줄 (라벨 + 내용)
function Info({ label, children }) {
  return <div className="grid gap-1 py-3 sm:grid-cols-[110px_1fr]"><dt className="text-xs font-bold text-slate-400">{label}</dt><dd className="text-sm leading-6 text-slate-700">{children}</dd></div>;
}

// 문의 응답 창
//  - 방문 시간 변경 요청(1) : 현재/희망 일정 + 보호자 코멘트 확인 → 담당 요양보호사 선택 → 응답(+배정 변경)
//  - 담당자 관련 문의(3) · 기타 문의(4) : 문의 내용 확인 → 답변
//  - 이미 응답한 문의는 기존 답변을 채워서 '응답 수정'으로 연다
export default function InquiryAnswerModal({ inquiry, siblings = [], otherPending = [], changedBy = null, onClose, onAnswered }) {
  const isEdit = Boolean(inquiry.answerContent);
  const isSchedule = inquiry.inquiryCategoryNo === 1;
  const [answer, setAnswer] = useState(inquiry.answerContent ?? "");
  const [options, setOptions] = useState({ status: "idle", data: null }); // idle | loading | ok | error
  const [picked, setPicked] = useState(null); // 선택한 요양보호사 번호
  const [busy, setBusy] = useState(false);

  const range = (s, e) => `${toHhmm(s)}~${toHhmm(e)}`;
  const wishLabel = (i) => `${i.wishDate} ${range(i.wishStartTime, i.wishEndTime)}`;
  // 문의 a 의 희망 일정이 방문 b 의 현재 시간과 같은지 (같은 방문이면 visit 값은 모두 같다)
  const sameTime = (a, b) => a.wishDate === b.visitDate && a.wishStartTime === b.visitStartTime && a.wishEndTime === b.visitEndTime;
  const alreadyMoved = Boolean(inquiry.requestNo && inquiry.wishDate) && sameTime(inquiry, inquiry); // 이 문의대로 이미 변경됨
  // 함께 보낸 다른 문의로 이미 변경됨 : 그 배정 변경이 '이 문의 접수 후'에 일어난 경우만 경고한다 (안전장치)
  //   (변경 뒤에 새로 접수된 문의는 보호자가 바뀐 시간을 알고 다시 요청한 것이므로 경고하지 않음)
  const toSec = (t) => String(t ?? "").replace(" ", "T").slice(0, 19); // "2026-10-11T21:41:23.996" → 초 단위로 비교
  const movedSibling = siblings.find((s) => sameTime(s, inquiry) && s.scheduleAppliedDate && toSec(inquiry.createDate) < toSec(s.scheduleAppliedDate));

  // 배정 변경을 할 수 없는 이유 (null 이면 가능)
  const blockReason = !isSchedule ? null
    : !inquiry.requestNo ? "연결된 방문 일정이 없는 문의라 배정을 변경할 수 없습니다. 응답 메시지만 보낼 수 있습니다."
    : !inquiry.wishDate ? "희망 일정이 없는 문의라 배정을 변경할 수 없습니다."
    : ["완료", "취소"].includes(inquiry.requestState) ? `이미 ${inquiry.requestState}된 방문이라 배정을 변경할 수 없습니다.`
    : null;
  const canLoad = isSchedule && !blockReason;       // 담당자 정보 조회 가능 (변경 전 : 후보 선택 / 변경 후 : 배정 결과 표시)
  const canApply = canLoad && !alreadyMoved;        // 배정 변경 가능
  const workStatusLabel = { 배정: "수락 대기", 확정: "수락 완료" };

  // 기존 근무자 + 희망 시간 기준 추천 3명 : GET /guardianinquiry/schedule-options?inquiryNo=번호
  async function loadOptions() {
    setOptions({ status: "loading", data: null });
    try {
      const response = await axios.get("http://localhost:8080/guardianinquiry/schedule-options", { params: { inquiryNo: inquiry.inquiryNo }, withCredentials: true });
      setOptions(response.data ? { status: "ok", data: response.data } : { status: "error", data: null }); // 서버가 null 이면 빈 응답
    } catch (error) {
      console.error("배정 후보 조회 실패:", error);
      setOptions({ status: "error", data: null });
    }
  }
  useEffect(() => { if (canLoad) loadOptions(); }, [inquiry.inquiryNo]);

  const d = options.data;
  const mustPick = Boolean(d?.currentCareworkerNo); // 기존 근무자가 있으면 반드시 한 명을 골라야 한다
  const applyDisabled = busy || !canApply || options.status !== "ok" || (mustPick && picked === null) || !answer.trim();

  // 응답 송신 : PUT /guardianinquiry/answer
  const submit = async (applySchedule) => {
    if (busy) return;
    if (!answer.trim()) { alert("응답 내용을 입력해주세요."); return; }
    // 배정 변경 확인창 : 이미 응답한 문의를 다시 적용하거나, 함께 보낸 다른 문의로 이미 변경된 경우
    if (applySchedule) {
      const confirmMessage = isEdit
        ? `이미 응답한 문의입니다. 다시 배정을 변경하면 방문이 ${wishLabel(inquiry)}(으)로 바뀝니다.`
          + (changedBy ? `\n지금 일정은 #${changedBy.inquiryNo} 응답으로 변경된 것이며, 그 일정을 덮어씁니다.` : "")
          + "\n계속할까요?"
        : movedSibling
          ? `이미 #${movedSibling.inquiryNo} 문의 일정(${wishLabel(movedSibling)})으로 변경된 방문입니다. ${wishLabel(inquiry)}(으)로 다시 변경할까요?`
          : null;
      if (confirmMessage && !window.confirm(confirmMessage)) return;
    }
    setBusy(true);
    try {
      const response = await axios.put("http://localhost:8080/guardianinquiry/answer",
        { inquiryNo: inquiry.inquiryNo, answerContent: answer.trim(), applySchedule, careworkerNo: applySchedule ? picked : null },
        { withCredentials: true });
      if (response.data) {
        onAnswered(); // 목록 새로고침 + 창 닫기
      } else {
        alert("처리하지 못했습니다. 근무 가능 여부나 방문 상태가 바뀌었을 수 있습니다.");
        if (applySchedule) { setPicked(null); loadOptions(); }
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const placeholder = movedSibling ? `예: 다른 희망 일정(${wishLabel(movedSibling)})으로 변경되었습니다.`
    : isSchedule ? "예: 원하시는 변경 시각에 배정되었습니다. 확인 부탁드립니다."
    : "예: 문의하신 내용은 다음과 같이 안내드립니다.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => { if (!busy) onClose(); }}>
      <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white text-slate-700 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        {/* 머리글 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">{isEdit ? "응답 수정" : "문의 응답"} <span className="font-mono text-sm text-slate-400">#{inquiry.inquiryNo}</span></h2>
            <p className="mt-0.5 text-xs text-slate-500">{inquiry.guardian?.guardianName ?? "-"} 보호자 · {inquiry.category} · {String(inquiry.createDate ?? "").slice(0, 10)} 접수</p>
          </div>
          <button type="button" aria-label="닫기" disabled={busy} onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100">×</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* 보호자가 보낸 내용 (수정 불가) */}
          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 px-4">
            {isSchedule && <>
              <Info label="수급자">{inquiry.careRecipientName ? `${inquiry.careRecipientName} 어르신` : "-"}</Info>
              <Info label="현재 방문 일정">{inquiry.visitDate ? <span className="flex flex-wrap items-center gap-2"><span className="font-mono">{inquiry.visitDate} {range(inquiry.visitStartTime, inquiry.visitEndTime)}</span>{assigneeStatus(inquiry) && <Badge tone={assigneeStatus(inquiry).tone}>{assigneeStatus(inquiry).label}</Badge>}{changedBy && <span className="text-[11px] font-semibold text-slate-500">#{changedBy.inquiryNo} 응답으로 변경됨 ({toSec(changedBy.scheduleAppliedDate).slice(5, 16).replace("T", " ")})</span>}</span> : "연결된 방문 일정이 없습니다."}</Info>
              <Info label="희망 방문 일정"><b className="font-mono text-teal-700">{inquiry.wishDate ? wishLabel(inquiry) : "-"}</b></Info>
            </>}
            <Info label={isSchedule ? "보호자 코멘트" : "문의 내용"}><span className="whitespace-pre-wrap">{inquiry.inquiryContent || "-"}</span></Info>
          </dl>

          {/* 함께 보낸 다른 희망 일정 (보호자가 '요청 보내기' 한 번에 희망 날짜마다 1건씩 보낸 문의) */}
          {isSchedule && siblings.length > 0 && (
            <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3">
              <p className="text-xs font-bold text-teal-800">함께 보낸 다른 희망 일정 {siblings.length}건</p>
              <ul className="mt-2 space-y-1">
                {siblings.map((s) => (
                  <li key={s.inquiryNo} className="flex items-center justify-between text-xs text-teal-900">
                    <span className="font-mono">#{s.inquiryNo} · {wishLabel(s)}</span>
                    <Badge tone={inquiryStatus(s).tone}>{inquiryStatus(s).label}</Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-teal-700">한 건으로 배정을 변경했다면 나머지 문의에도 응답을 남겨 주세요.</p>
            </div>
          )}
          {isSchedule && movedSibling && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">#{movedSibling.inquiryNo} 문의의 희망 일정({wishLabel(movedSibling)})으로 이미 배정이 변경되었습니다. 이 문의로 다시 변경하면 방문 시간이 한 번 더 바뀝니다.</p>
          )}
          {/* 참고 : 같은 수급자의 다른 응답 대기 시간 변경 요청 (함께 보낸 문의와는 따로 표시) */}
          {isSchedule && otherPending.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              <p className="font-semibold text-amber-800">참고 · {inquiry.careRecipientName ?? "이"} 어르신의 다른 시간 변경 요청 중 응답 대기 {otherPending.length}건</p>
              <ul className="mt-1.5 space-y-1">
                {otherPending.map((o) => (
                  <li key={o.inquiryNo} className="font-mono">
                    #{o.inquiryNo} · 현재 {o.visitDate ? `${o.visitDate} ${range(o.visitStartTime, o.visitEndTime)}` : "-"} → 희망 {o.wishDate ? wishLabel(o) : "-"}
                    {o.requestNo === inquiry.requestNo && <span className="ml-1.5 rounded bg-amber-100 px-1 font-sans text-[10px] font-bold text-amber-800">같은 방문</span>}
                    <span className="ml-1.5 font-sans text-amber-600">{String(o.createDate ?? "").slice(0, 10)} 접수</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-amber-700">같은 요양보호사가 맡은 방문끼리 시간이 맞물리면(예: 수→목, 목→금), 뒤쪽 날짜 요청부터 처리해야 그 요양보호사를 다시 선택할 수 있습니다.</p>
            </div>
          )}

          {/* 담당 요양보호사 선택 (방문 시간 변경 요청만) */}
          {isSchedule && (
            <section className="space-y-2">
              <p className="text-xs font-bold text-slate-600">담당 요양보호사 <span className="font-normal text-slate-400">({alreadyMoved ? "배정 변경 결과" : "희망 일정 기준"})</span></p>
              {blockReason && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{blockReason}</p>}
              {canLoad && options.status === "loading" && <p className="text-sm text-slate-500">{alreadyMoved ? "배정된 요양보호사를 불러오는 중입니다..." : "희망 시간에 배정할 수 있는 요양보호사를 찾는 중입니다..."}</p>}
              {canLoad && options.status === "error" && <p className="text-sm text-rose-600">{alreadyMoved ? "배정 정보를" : "후보를"} 불러오지 못했습니다. <button type="button" onClick={loadOptions} className="font-bold text-teal-700 underline">다시 불러오기</button></p>}
              {/* 배정 변경 결과 : 이 문의의 희망 일정으로 옮겨진 뒤 현재 배정된 요양보호사 */}
              {alreadyMoved && options.status === "ok" && (
                <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
                  <p className="text-xs text-teal-700">이 문의의 희망 일정({wishLabel(inquiry)})으로 변경되었습니다.</p>
                  {d.currentCareworkerNo ? (
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-teal-900">
                      배정된 요양보호사 <b className="text-base">{d.currentCareworkerName}</b>
                      <Badge tone={d.currentWorkStatus === "확정" ? "ok" : "warning"}>{workStatusLabel[d.currentWorkStatus] ?? d.currentWorkStatus}</Badge>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-amber-700">배정된 요양보호사가 없습니다. 요청 관리에서 배정해 주세요.</p>
                  )}
                </div>
              )}
              {canApply && options.status === "ok" && <>
                {/* 기존 근무자 : 희망 시간에 근무 불가면 붉게 + 클릭 불가 */}
                {d.currentCareworkerNo ? (
                  <button type="button" disabled={!d.currentAvailable} onClick={() => setPicked(d.currentCareworkerNo)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${!d.currentAvailable ? "cursor-not-allowed border-red-200 bg-red-50" : picked === d.currentCareworkerNo ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${d.currentAvailable ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-600"}`}>기존</span>
                    <span className="flex-1">
                      <b className={`text-sm ${d.currentAvailable ? "text-slate-800" : "text-red-700"}`}>{d.currentCareworkerName}</b>
                      <span className="mt-0.5 block text-[11px] text-slate-500">기존 근무자 · {d.currentWorkStatus}</span>
                    </span>
                    <span className={`text-[11px] font-bold ${d.currentAvailable ? "text-teal-600" : "text-red-600"}`}>{d.currentAvailable ? "희망 시간 근무 가능" : "희망 시간 근무 불가"}</span>
                  </button>
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">기존 담당자가 없습니다. 후보를 선택하지 않으면 방문 시간만 변경되고 '신청' 상태로 남습니다.</p>
                )}

                {/* 희망 시간 기준 추천 상위 3명 */}
                {(d.candidates ?? []).length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600">추천 후보 상위 {d.candidates.length}명</p>
                    {d.candidates.map((c, idx) => (
                      <button key={c.careworkerNo} type="button" onClick={() => setPicked(picked === c.careworkerNo ? null : c.careworkerNo)} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${picked === c.careworkerNo ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}>
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{idx + 1}</span>
                        <span className="flex-1">
                          <b className="text-sm text-slate-800">{c.careworkerName}</b>
                          <span className="mt-0.5 block text-[11px] text-slate-500">거리 {Number(c.distanceKm).toFixed(1)}km · 최근 30일 {c.workCount}회{c.continuityCount !== undefined ? ` · 연속요양 ${c.continuityCount}회` : ""}</span>
                        </span>
                        <span className="font-mono text-sm font-bold text-teal-600">{Number(c.totalScore).toFixed(1)}점</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">희망 시간에 배정할 수 있는 추천 후보가 없습니다. 근무중인지, 선호 성별이 맞는지, 근무 가능 시간이 등록돼 있는지, 같은 시간에 다른 일정이 없는지를 확인해주세요.</p>
                )}
              </>}
            </section>
          )}

          {/* 관리자 코멘트 */}
          <label className="block text-xs font-semibold text-slate-600">{isSchedule ? "관리자 코멘트" : "답변"}
            <textarea rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={placeholder} maxLength={1000}
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
          </label>
        </div>

        {/* 버튼 */}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">
          {isSchedule ? <>
            <button type="button" disabled={applyDisabled} onClick={() => submit(true)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40">{busy ? "처리 중..." : "응답 송신 및 배정 변경"}</button>
            <button type="button" disabled={busy || !answer.trim()} onClick={() => submit(false)} className="rounded-lg border border-teal-200 px-4 py-2.5 text-sm font-bold text-teal-700 transition hover:bg-teal-50 disabled:opacity-40">{isEdit ? "응답 메시지 수정" : "응답 메시지 송신"}</button>
          </> : (
            <button type="button" disabled={busy || !answer.trim()} onClick={() => submit(false)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-40">{busy ? "처리 중..." : isEdit ? "응답 수정" : "응답"}</button>
          )}
          <button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">닫기</button>
        </div>
      </div>
    </div>
  );
}
