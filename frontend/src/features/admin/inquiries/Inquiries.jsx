import { normalizeGuardian, normalizeInquiry, normalizeCategory } from "../../../utils/guardianAdapters";
import { useEffect, useState } from "react";
import { toHhmm } from "../../../utils/timeFormat";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import LoadStatus from "../../../components/common/LoadStatus";

export default function Inquiries() {
    const [inquiries, setInquiries] = useState([]);
    const [guardians, setGuardians] = useState([]);
    const [categories, setCategories] = useState([]);
    const [status, setStatus] = useState("loading");
    const [loadError, setLoadError] = useState(null);
    const [q, setQ] = useState("");

    // 보호자 문의 전체 조회(관리자) : 문의 + 보호자 + 문의 유형을 axios로 조회
    async function loadData() {
        setStatus("loading");
        try {
            const [inquiriesRes, guardiansRes, categoriesRes] = await Promise.all([
                axios.get("/api/보호자문의", { withCredentials: true }).then((res) => ({ ...res, data: res.data.map(normalizeInquiry) })),
                axios.get("/api/보호자", { withCredentials: true }).then((res) => ({ ...res, data: res.data.map(normalizeGuardian) })),
                axios.get("/api/문의카테고리", { withCredentials: true }).then((res) => ({ ...res, data: res.data.map(normalizeCategory) })),
            ]);
            setInquiries(inquiriesRes.data);
            setGuardians(guardiansRes.data);
            setCategories(categoriesRes.data);
            setStatus("ok");
        } catch (error) {
            console.error("문의 조회 실패:", error);
            setLoadError(error);
            setStatus("error");
        }
    }
    useEffect(() => { loadData(); }, []);

    // 문의 삭제 : DELETE /guardianinquiry (body 에 { inquiryNo })
    const removeInquiry = async (inquiry) => {
        if (!window.confirm("이 문의를 삭제할까요?")) return;
        try {
            const response = await axios.delete(`/api/보호자문의/${inquiry.inquiryNo}`, { withCredentials: true });
            if (response.data) loadData();
            else alert("삭제에 실패했습니다.");
        } catch (error) {
            console.error(error);
            alert("서버 통신 오류가 발생했습니다.");
        }
    };

    const guardianOf = (no) => guardians.find((g) => g.guardianNo === no);
    const categoryOf = (no) => categories.find((c) => c.inquiryCategoryNo === no)?.inquiryCategoryName ?? "-";
    const rows = inquiries
        .map((i) => ({ ...i, guardian: guardianOf(i.guardianNo), category: categoryOf(i.inquiryCategoryNo) }))
        .filter((i) => `${i.guardian?.guardianName ?? ""}${i.category}${i.inquiryContent ?? ""}`.includes(q))
        .sort((a, b) => b.inquiryNo - a.inquiryNo);

    if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
    return (
        <div className="space-y-5">
            <SectionTitle title="문의 관리" subtitle="보호자가 센터에 보낸 요청·문의 목록입니다." action={<button onClick={() => { setQ(""); loadData(); }} className="rounded-lg border border-teal-200 bg-white px-4 py-2.5 text-sm font-bold text-teal-700 transition hover:bg-teal-50">↻ 새로고침</button>} />
            <Panel className="overflow-hidden">
                <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="보호자명, 문의 유형, 내용 검색" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-80" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-sm">
                        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400"><tr>{["번호", "보호자", "문의 유형", "희망 일정", "내용", ""].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
                        <tbody>
                            {rows.map((i) => (
                                <tr key={i.inquiryNo} className="border-t border-slate-100 align-top hover:bg-slate-50/70">
                                    <td className="px-5 py-4 font-mono text-slate-500">{i.inquiryNo}</td>
                                    <td className="px-5 py-4"><b className="text-slate-800">{i.guardian?.guardianName ?? "-"}</b>{i.guardian && <span className="ml-1 text-xs text-slate-400">({i.guardian.guardianRelationship})</span>}</td>
                                    <td className="px-5 py-4"><Badge tone="info">{i.category}</Badge></td>
                                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{i.wishDate ? `${i.wishDate} ${toHhmm(i.wishStartTime)}~${toHhmm(i.wishEndTime)}` : "-"}</td>
                                    <td className="px-5 py-4 text-slate-600">{i.inquiryContent}</td>
                                    <td className="px-5 py-4 text-right"><button onClick={() => removeInquiry(i)} className="text-xs font-bold text-red-500 hover:underline">삭제</button></td>
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">접수된 문의가 없습니다.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    );
}
