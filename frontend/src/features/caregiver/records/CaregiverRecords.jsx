import { useState } from "react";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import CaregiverPageTitle from "../CaregiverPageTitle";
import RecordFormModal from "./RecordFormModal";

// onSave는 실제 서버 저장 성공 시에만 true를 반환합니다.
export default function CaregiverRecords({ items = [], loading = false, error = "", onRetry, connected = false, onSave = null }) {
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState("");
  const keyword = search.trim().toLowerCase();
  const filtered = items.filter((item) => (!date || item.visitDate === date) && (!keyword || `${item.recipientName || ""} ${item.content || ""} ${item.notes || ""}`.toLowerCase().includes(keyword)));
  const canSave = connected && typeof onSave === "function";
  const openForm = (item) => { setMessage(""); setModal({ item }); };

  const save = async (form, recordNo) => {
    if (!canSave) return false;
    const result = await onSave(form, recordNo);
    if (result === true) {
      setModal(null);
      setMessage("업무 기록을 저장했습니다.");
    }
    return result === true;
  };

  return (
    <div className="space-y-5">
      <CaregiverPageTitle title="업무 기록" subtitle="방문 시 제공한 업무와 특이사항을 작성하고 확인하세요." action={<button type="button" onClick={() => openForm(null)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700">＋ 기록 작성</button>} />
      {message && <p role="status" className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p>}
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3"><h2 className="font-display font-bold text-slate-900">내 업무 기록 {!loading && !error && <span className="ml-1 text-sm text-teal-700">{filtered.length}건</span>}</h2>{onRetry && <button type="button" onClick={onRetry} disabled={loading} className="text-xs font-semibold text-teal-600 disabled:opacity-40">새로고침</button>}</div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-slate-600">방문일<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1.5 block rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
            <label className="min-w-0 flex-1 basis-48 text-xs font-semibold text-slate-600">수급자 / 업무 내용 검색<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="수급자 이름, 업무 내용, 특이사항" className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></label>
            <button type="button" onClick={() => { setDate(""); setSearch(""); }} disabled={!date && !search} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">초기화</button>
          </div>
        </div>
        {loading ? <div role="status" className="px-5 py-16 text-center text-sm text-slate-500">업무 기록을 불러오는 중입니다...</div> : error ? (
          <div role="alert" className="px-5 py-12 text-center"><p className="text-sm font-semibold text-rose-600">업무 기록을 불러오지 못했습니다.</p><p className="mt-2 text-xs text-slate-500">{typeof error === "string" ? error : "잠시 후 다시 시도해주세요."}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700">다시 불러오기</button>}</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{["방문일", "수급자", "업무 내용", "특이사항", "작성 상태", "관리"].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead>
              <tbody>{filtered.map((item) => <tr key={item.recordNo} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">{item.visitDate || "정보 없음"}</td><td className="px-5 py-4">{item.recipientName || "정보 없음"}</td><td className="max-w-xs px-5 py-4"><p className="line-clamp-2 break-words">{item.content || "내용 없음"}</p></td><td className="max-w-xs px-5 py-4 text-slate-500"><p className="line-clamp-2 break-words">{item.notes || "—"}</p></td><td className="px-5 py-4"><Badge>{item.status || "상태 정보 없음"}</Badge></td><td className="px-5 py-4"><button type="button" onClick={() => openForm(item)} className="whitespace-nowrap rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50">상세 / 수정</button></td></tr>)}</tbody>
            </table></div>
            <div className="divide-y divide-slate-100 md:hidden">{filtered.map((item) => <article key={item.recordNo} className="space-y-3 px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-900">{item.visitDate || "방문일 정보 없음"}</p><Badge>{item.status || "상태 정보 없음"}</Badge></div><dl className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 text-sm"><dt className="text-slate-500">수급자</dt><dd>{item.recipientName || "정보 없음"}</dd><dt className="text-slate-500">업무 내용</dt><dd className="line-clamp-3 break-words">{item.content || "내용 없음"}</dd><dt className="text-slate-500">특이사항</dt><dd className="line-clamp-2 break-words">{item.notes || "—"}</dd></dl><button type="button" onClick={() => openForm(item)} className="w-full rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50">상세 / 수정</button></article>)}</div>
            {filtered.length === 0 && <div role="status" className="px-5 py-14 text-center"><p className="text-sm font-semibold text-slate-600">{items.length === 0 ? "등록된 업무 기록이 없습니다." : "검색 조건에 맞는 업무 기록이 없습니다."}</p><p className="mt-2 text-xs text-slate-400">{items.length === 0 ? "기록 작성 버튼을 눌러 방문 업무 입력 화면을 열 수 있습니다." : "방문일이나 검색어를 변경해주세요."}</p>{items.length === 0 && <button type="button" onClick={() => openForm(null)} className="mt-4 rounded-lg border border-teal-200 px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50">기록 작성</button>}</div>}
          </>
        )}
        {!connected && <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-5 text-slate-500">서버 업무 기록 API 연결 대기 중입니다. 입력 화면은 사용할 수 있으며, 기록 저장은 연결 후 가능합니다.</p>}
      </Panel>
      {modal && <RecordFormModal item={modal.item} onClose={() => setModal(null)} onSave={canSave ? save : null} />}
    </div>
  );
}
