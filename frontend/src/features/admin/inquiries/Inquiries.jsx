import { useEffect, useState } from "react";
import { toHhmm } from "../../../utils/timeFormat";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import LoadStatus from "../../../components/common/LoadStatus";
import InquiryAnswerModal from "./InquiryAnswerModal";
import { inquiryStatus } from "../../../utils/inquiryStatus";
import useNotifyRefresh from "../useNotifyRefresh";
import Pagination from "../../../components/common/Pagination";
import { usePagination } from "../../../utils/usePagination";

export default function Inquiries() {
    const [inquiries, setInquiries] = useState([]);
    const [guardians, setGuardians] = useState([]);
    const [categories, setCategories] = useState([]);
    const [status, setStatus] = useState("loading");
    const [loadError, setLoadError] = useState(null);
    const [q, setQ] = useState("");
    const [answering, setAnswering] = useState(null); // 응답 창을 연 문의 (null 이면 닫힘)

    // 보호자 문의 전체 조회(관리자) : 문의 + 보호자 + 문의 유형을 axios로 조회
    // silent : 응답·삭제 뒤 새로고침은 로딩 화면 없이 데이터만 바꾼다 (표가 사라지면 스크롤이 맨 위로 튐)
    async function loadData({ silent = false } = {}) {
        if (!silent) setStatus("loading");
        try {
            const [inquiriesRes, guardiansRes, categoriesRes] = await Promise.all([
                axios.get("http://localhost:8080/guardianinquiry", { withCredentials: true }),
                axios.get("http://localhost:8080/guardian", { withCredentials: true }),
                axios.get("http://localhost:8080/inquirycategory", { withCredentials: true }),
            ]);
            setInquiries(inquiriesRes.data);
            setGuardians(guardiansRes.data);
            setCategories(categoriesRes.data);
            setStatus("ok");
        } catch (error) {
            console.error("문의 조회 실패:", error);
            if (silent) { alert("목록을 새로고침하지 못했습니다. 새로고침 버튼을 눌러주세요."); return; } // 보던 목록은 그대로 둔다
            setLoadError(error);
            setStatus("error");
        }
    }
    useEffect(() => { loadData(); }, []);
    useNotifyRefresh("inquiries", () => loadData({ silent: true }));   // 새 문의 알림이 오면 로딩 화면 없이 목록을 다시 불러온다

    // 문의 삭제 : DELETE /guardianinquiry?inquiryNo=번호
    const removeInquiry = async (inquiry) => {
        if (!window.confirm("이 문의를 삭제할까요?")) return;
        try {
            const response = await axios.delete("http://localhost:8080/guardianinquiry", { params: { inquiryNo: inquiry.inquiryNo }, withCredentials: true });
            if (response.data) loadData({ silent: true });
            else alert("삭제에 실패했습니다.");
        } catch (error) {
            console.error(error);
            alert("서버 통신 오류가 발생했습니다.");
        }
    };

    const guardianOf = (no) => guardians.find((g) => g.guardianNo === no);
    const categoryOf = (no) => categories.find((c) => c.inquiryCategoryNo === no)?.inquiryCategoryName ?? "-";
    const statusOf = (i) => inquiryStatus(i).label; // 응답 대기 / 응답 완료 / 응답 · 일정 변경
    const range = (date, start, end) => `${date} ${toHhmm(start)}~${toHhmm(end)}`;
    // 이 문의의 희망 일정으로 이미 방문이 옮겨졌는지 (현재 = 희망)
    const isMoved = (i) => Boolean(i.visitDate && i.wishDate) && i.visitDate === i.wishDate && i.visitStartTime === i.wishStartTime && i.visitEndTime === i.wishEndTime;

    // 함께 보낸 문의 : 보호자가 '요청 보내기' 한 번에 보낸 방문 시간 변경 문의(희망 날짜마다 1건)끼리 묶음 번호(inquiryGroup)가 같다
    const byGroup = new Map();
    inquiries
        .filter((i) => i.inquiryGroup && i.inquiryCategoryNo === 1) // 묶음 번호가 없는 예전 데이터·기타 문의는 묶지 않는다
        .forEach((i) => byGroup.set(i.inquiryGroup, [...(byGroup.get(i.inquiryGroup) ?? []), i]));
    const siblingsOf = (i) => (i.inquiryGroup ? byGroup.get(i.inquiryGroup) ?? [] : []).filter((s) => s.inquiryNo !== i.inquiryNo);
    // 목록 표시용 : 함께 보낸 문의 중 아직 처리할 문의(응답 대기)만 센다 (팝업에는 응답 완료까지 전부 보여 준다)
    const pendingSiblingsOf = (i) => siblingsOf(i).filter((s) => !s.answerContent);
    // 현재 방문 일정을 만든 다른 문의 : 같은 방문에서 배정 변경을 했고, 그 희망 일정이 지금 방문 시간과 같은 문의 (가장 최근 것)
    const changedByOf = (i) => i.requestNo
        ? inquiries
            .filter((o) => o.inquiryNo !== i.inquiryNo && o.requestNo === i.requestNo && o.scheduleAppliedDate
                && o.wishDate === i.visitDate && o.wishStartTime === i.visitStartTime && o.wishEndTime === i.visitEndTime)
            .sort((a, b) => String(b.scheduleAppliedDate).localeCompare(String(a.scheduleAppliedDate)))[0] ?? null
        : null;
    // 참고용 : 같은 수급자의 다른 응답 대기 방문 시간 변경 문의 (함께 보낸 문의와 섞지 않고 팝업에 따로 표시)
    //   예) 수·목 → 목·금 : '수→목', '목→금' 이 따로 접수되므로 서로 보이게 해서 처리 순서를 판단할 수 있게 한다
    const otherPendingOf = (i) => i.careRecipientNo
        ? inquiries.filter((o) => o.careRecipientNo === i.careRecipientNo && o.inquiryNo !== i.inquiryNo && o.inquiryCategoryNo === 1
            && !o.answerContent && !(i.inquiryGroup && o.inquiryGroup === i.inquiryGroup))
        : [];

    const rows = inquiries
        .map((i) => ({ ...i, guardian: guardianOf(i.guardianNo), category: categoryOf(i.inquiryCategoryNo), status: statusOf(i) }))
        .filter((i) => `${i.guardian?.guardianName ?? ""}${i.careRecipientName ?? ""}${i.category}${i.status}${i.inquiryContent ?? ""}`.includes(q))
        .sort((a, b) => b.inquiryNo - a.inquiryNo);
    // 페이징 : 한 페이지 10건, 검색어가 바뀌면 1페이지로 (응답 뒤·새 알림 뒤 새로고침에서는 지금 페이지 유지)
    // 함께 보낸 문의 · 참고 박스 · "#N 응답으로 변경됨" 은 자르기 전 전체 inquiries 로 계산한다
    const { page, setPage, totalPages, pageItems, total } = usePagination(rows, 10, [q]);

    if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
    return (
        <div className="space-y-5">
            <SectionTitle title="문의 관리" subtitle="보호자가 센터에 보낸 요청·문의 목록입니다." action={<button onClick={() => { setQ(""); loadData(); }} className="rounded-lg border border-teal-200 bg-white px-4 py-2.5 text-sm font-bold text-teal-700 transition hover:bg-teal-50">↻ 새로고침</button>} />
            <Panel className="overflow-hidden">
                <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="보호자·수급자명, 문의 유형, 상태, 내용 검색" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-80" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] text-sm">
                        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400"><tr>{["번호", "보호자", "문의 유형", "방문 일정 (현재 → 희망)", "내용", "상태", ""].map((h) => <th key={h} className="whitespace-nowrap px-5 py-3">{h}</th>)}</tr></thead>
                        <tbody>
                            {pageItems.map((i) => (
                                <tr key={i.inquiryNo} className="border-t border-slate-100 align-top hover:bg-slate-50/70">
                                    <td className="px-5 py-4 font-mono text-slate-500">{i.inquiryNo}</td>
                                    {/* 보호자 · 관계 / 어르신 이름이 글자 단위로 꺾이지 않도록 한 줄씩 유지 */}
                                    <td className="whitespace-nowrap px-5 py-4">
                                        {/* 보호자 목록에는 탈퇴한 보호자가 없으므로 찾지 못하면 탈퇴로 표시 */}
                                        <b className={i.guardian ? "text-slate-800" : "text-slate-400"}>{i.guardian?.guardianName ?? "탈퇴한 보호자"}</b>{i.guardian && <span className="ml-1 text-xs text-slate-400">({i.guardian.guardianRelationship})</span>}
                                        {i.careRecipientName && <span className="mt-0.5 block text-[11px] text-slate-400">{i.careRecipientName} 어르신</span>}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4"><Badge tone="info">{i.category}</Badge></td>
                                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-600">
                                        {/* 현재 방문 일정(연결된 요청) → 희망 일정. 이미 옮겨졌으면 희망 일정 한 줄 + '변경 완료' */}
                                        {isMoved(i) ? (
                                            <p className="font-semibold text-teal-700"><span className="mr-1.5 font-sans text-[10px] font-bold text-emerald-600">변경 완료</span>{range(i.wishDate, i.wishStartTime, i.wishEndTime)}</p>
                                        ) : <>
                                            {i.visitDate && <p className="text-slate-500"><span className="mr-1.5 inline-block w-6 font-sans text-[10px] font-bold text-slate-400">현재</span>{range(i.visitDate, i.visitStartTime, i.visitEndTime)}</p>}
                                            {i.wishDate && <p className={i.visitDate ? "mt-1 font-semibold text-teal-700" : ""}><span className="mr-1.5 inline-block w-6 font-sans text-[10px] font-bold text-teal-500">희망</span>{range(i.wishDate, i.wishStartTime, i.wishEndTime)}</p>}
                                            {!i.visitDate && !i.wishDate && "-"}
                                        </>}
                                        {pendingSiblingsOf(i).length > 0 && <span className="mt-1 block font-sans text-[10px] font-semibold text-teal-600">함께 보낸 문의 대기 {pendingSiblingsOf(i).length}건</span>}
                                    </td>
                                    <td className="min-w-[240px] px-5 py-4 text-slate-600">{i.inquiryContent}</td>
                                    <td className="whitespace-nowrap px-5 py-4"><Badge tone={inquiryStatus(i).tone}>{i.status}</Badge></td>
                                    <td className="whitespace-nowrap px-5 py-4 text-right">
                                        <button onClick={() => setAnswering(i)} className={`mr-3 rounded-lg px-3 py-1.5 text-xs font-bold transition ${i.answerContent ? "border border-teal-200 text-teal-700 hover:bg-teal-50" : "bg-teal-600 text-white hover:bg-teal-700"}`}>{i.answerContent ? "응답 수정" : "응답하기"}</button>
                                        <button onClick={() => removeInquiry(i)} className="text-xs font-bold text-red-500 hover:underline">삭제</button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">접수된 문의가 없습니다.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
            </Panel>
            {answering && <InquiryAnswerModal inquiry={answering} siblings={siblingsOf(answering)} otherPending={otherPendingOf(answering)} changedBy={changedByOf(answering)} onClose={() => setAnswering(null)} onAnswered={() => { setAnswering(null); loadData({ silent: true }); }} />}
        </div>
    );
}
