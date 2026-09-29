import { useEffect, useState } from "react";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import LoadStatus from "../../../components/common/LoadStatus";

const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

// 센터 등록·수정 모달 : POST /center, PUT /center
function CenterForm({ center, onClose, onSaved }) {
    const isEdit = Boolean(center);
    const [form, setForm] = useState({ name: center?.centerName ?? "", address: center?.centerAddress ?? "", phone: center?.centerPhonenumber ?? "" });
    const [message, setMessage] = useState("");
    const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const save = async () => {
        if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
            setMessage("센터명, 주소, 전화번호를 입력해주세요.");
            return;
        }
        const body = { centerName: form.name.trim(), centerAddress: form.address.trim(), centerPhonenumber: form.phone.trim() };
        try {
            const response = isEdit
                ? await axios.put("http://localhost:8080/center", { ...body, centerNo: center.centerNo }, { withCredentials: true })
                : await axios.post("http://localhost:8080/center", body, { withCredentials: true });
            if (response.data) onSaved();
            else setMessage("저장에 실패했습니다. 입력 정보를 확인해주세요.");
        } catch (error) {
            console.error(error);
            setMessage("서버 통신 오류가 발생했습니다.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-display text-lg font-bold text-slate-900">{isEdit ? "센터 수정" : "센터 등록"}</h2>
                    <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
                </div>
                <div className="space-y-3 px-6 py-5">
                    <label className="block text-xs font-semibold text-slate-600">센터명<input value={form.name} onChange={(e) => update("name", e.target.value)} className={field} placeholder="예: 안양 온케어 방문요양센터" /></label>
                    <label className="block text-xs font-semibold text-slate-600">주소<input value={form.address} onChange={(e) => update("address", e.target.value)} className={field} placeholder="예: 경기도 안양시 동안구 시민대로 180" /></label>
                    <label className="block text-xs font-semibold text-slate-600">전화번호<input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={field} placeholder="예: 031-380-1001" /></label>
                    {message && <p className="text-xs font-semibold text-rose-600">{message}</p>}
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">취소</button>
                    <button onClick={save} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">{isEdit ? "수정 저장" : "등록"}</button>
                </div>
            </div>
        </div>
    );
}

export default function Centers() {
    const [centers, setCenters] = useState([]);
    const [status, setStatus] = useState("loading");
    const [formTarget, setFormTarget] = useState(null); // null: 닫힘, "new": 등록, 센터 DTO: 수정

    // 센터 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
    async function loadData() {
        setStatus("loading");
        try {
            const response = await axios.get("http://localhost:8080/center", { withCredentials: true });
            setCenters(response.data);
            setStatus("ok");
        } catch (error) {
            console.error("센터 조회 실패:", error);
            setStatus("error");
        }
    }
    useEffect(() => { loadData(); }, []);

    // 센터 삭제 : DELETE /center?no=번호 (쿼리 파라미터로 전달)
    const removeCenter = async (c) => {
        if (!window.confirm(`${c.centerName}을(를) 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
        try {
            const response = await axios.delete("http://localhost:8080/center", { params: { no: c.centerNo }, withCredentials: true });
            if (response.data) loadData();
            else alert("삭제에 실패했습니다.");
        } catch (error) {
            console.error(error);
            alert("삭제할 수 없습니다. 소속 요양보호사가 있으면 먼저 정리해야 합니다.");
        }
    };

    if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} />;
    return (
        <div className="space-y-5">
            <SectionTitle title="센터 관리" subtitle="방문요양 센터를 등록하고 정보를 수정합니다." action={<button onClick={() => setFormTarget("new")} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">+ 센터 등록</button>} />
            <Panel className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400"><tr>{["번호", "센터명", "주소", "전화번호", ""].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
                        <tbody>
                            {centers.map((c) => (
                                <tr key={c.centerNo} className="border-t border-slate-100 hover:bg-slate-50/70">
                                    <td className="px-5 py-4 font-mono text-slate-500">{c.centerNo}</td>
                                    <td className="px-5 py-4 font-bold text-slate-800">{c.centerName}</td>
                                    <td className="px-5 py-4 text-slate-600">{c.centerAddress}</td>
                                    <td className="px-5 py-4 font-mono text-slate-600">{c.centerPhonenumber}</td>
                                    <td className="px-5 py-4 text-right whitespace-nowrap">
                                        <button onClick={() => setFormTarget(c)} className="mr-3 text-xs font-bold text-teal-600 hover:underline">수정</button>
                                        <button onClick={() => removeCenter(c)} className="text-xs font-bold text-red-500 hover:underline">삭제</button>
                                    </td>
                                </tr>
                            ))}
                            {centers.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">등록된 센터가 없습니다.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Panel>
            {formTarget && <CenterForm center={formTarget === "new" ? null : formTarget} onClose={() => setFormTarget(null)} onSaved={() => { setFormTarget(null); loadData(); }} />}
        </div>
    );
}
