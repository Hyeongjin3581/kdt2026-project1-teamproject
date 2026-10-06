import { useRef, useState } from "react";
import caregiverApi from "../caregiverApi";
import Panel from "../../../components/common/Panel";
import LoadStatus from "../../../components/common/LoadStatus";
import CaregiverPageTitle from "../CaregiverPageTitle";
import AvailabilityFormModal from "./AvailabilityFormModal";
import AvailabilityWeekView from "./AvailabilityWeekView";
import availabilityTime, { defaultAvailabilityStatus, formatUiTime, isUiTimeRange } from "./availabilityTime";

export default function CaregiverAvailability({ careworkerNo, items, status, error, onReload, api = caregiverApi, timeAdapter = availabilityTime, confirmedWork = [] }) {
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const removing = useRef(false);
  const [message, setMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [pendingSelection, setPendingSelection] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const savingSelection = useRef(false);

  const reload = async () => {
    const refreshed = await onReload();
    if (refreshed) { setPendingSelection(null); setSaveError(""); }
    return refreshed;
  };

  const saveSelection = async (selection) => {
    if (savingSelection.current || pendingSelection || status !== "ok") return;
    setSaveError("");
    setMessage("");
    if (!Number.isInteger(careworkerNo) || careworkerNo < 1 || !isUiTimeRange(selection.startMinutes, selection.endMinutes)) return;
    const startTime = timeAdapter.uiTimeToBackendValue(selection.startMinutes);
    const endTime = timeAdapter.uiTimeToBackendValue(selection.endMinutes);
    if (!Number.isInteger(startTime) || !Number.isInteger(endTime) || startTime < 0 || endTime > 2147483647 || startTime >= endTime || !defaultAvailabilityStatus) {
      setSaveError("자동 저장용 시간·상태 규칙을 확인해야 합니다. 선택한 값은 전송되지 않았습니다.");
      return;
    }
    if (api.isDemo && !api.demoAvailability) { setSaveError("체험 세션을 다시 로그인해주세요. 실제 DB에는 저장하지 않습니다."); return; }
    if (items.some((item) => item.caregiverNo === careworkerNo && item.availableDate === selection.availableDate && item.startTime === startTime && item.endTime === endTime)) {
      setMessage("이미 등록된 가용시간입니다.");
      return;
    }
    savingSelection.current = true;
    setAutoSaving(true);
    setPendingSelection(selection);
    try {
      const body = { caregiverNo: careworkerNo, availableDate: selection.availableDate, startTime, endTime, status: defaultAvailabilityStatus };
      if (api.isDemo) {
        api.demoAvailability.create(body);
      } else {
        const response = await api.createAvailability(body);
        if (response.data !== true) {
          setPendingSelection(null);
          setSaveError("가용시간을 저장하지 못했습니다. 선택 구간을 다시 확인해주세요.");
          return;
        }
      }
      setPendingSelection({ ...selection, label: api.isDemo ? "체험 반영 · 목록 확인 중" : "저장 완료 · 목록 확인 중" });
      setMessage(`${selection.availableDate} · ${formatUiTime(selection.startMinutes)} ~ ${formatUiTime(selection.endMinutes)} ${api.isDemo ? "체험 화면에 반영했습니다. 실제 DB에는 저장하지 않았습니다." : "가용시간을 저장했습니다."}`);
      if (await onReload(false)) setPendingSelection(null);
      else setSaveError(api.isDemo ? "체험 목록을 다시 불러오지 못했습니다. 화면의 새로고침 버튼으로 확인해주세요." : "저장은 완료됐지만 목록을 다시 불러오지 못했습니다. 새로고침으로 확인해주세요.");
    } catch (error) {
      setPendingSelection(null);
      setSaveError(api.isDemo ? "체험 가용시간을 반영하지 못했습니다. 다시 로그인해주세요." : error.response ? `가용시간 저장 요청 실패 (HTTP ${error.response.status}). 새로고침하여 저장 여부를 확인해주세요.` : "서버 응답을 받지 못했습니다. 재등록 전에 새로고침하여 저장 여부를 확인해주세요.");
    } finally {
      savingSelection.current = false;
      setAutoSaving(false);
    }
  };

  const saved = async (text) => {
    setModal(null);
    setMessage(text);
    const refreshed = await onReload();
    if (!refreshed) setMessage(`${text} 목록을 다시 불러오지 못했습니다.`);
  };

  const remove = async () => {
    if (!deleting || removing.current || deleting.caregiverNo !== careworkerNo) return;
    if (api.isDemo && !api.demoAvailability) { setDeleteError("체험 세션을 다시 로그인해주세요."); return; }
    removing.current = true;
    setBusy(true);
    setDeleteError("");
    try {
      if (api.isDemo) api.demoAvailability.remove(deleting.availabilityNo);
      else {
        const response = await api.deleteAvailability(deleting.availabilityNo);
        if (response.data !== true) { setDeleteError("삭제하지 못했습니다. 목록을 새로고침한 뒤 다시 확인해주세요."); return; }
      }
      setDeleting(null);
      const text = api.isDemo ? "체험 가용시간을 제거했습니다. 실제 DB는 변경하지 않았습니다." : "가용시간을 삭제했습니다.";
      setMessage(text);
      if (!await onReload()) setMessage(`${text} 목록을 다시 불러오지 못했습니다.`);
    } catch (requestError) {
      setDeleteError(requestError.response ? `가용시간 삭제 실패 (HTTP ${requestError.response.status})` : "백엔드에 연결할 수 없습니다. 서버 실행 상태를 확인해주세요.");
    } finally {
      removing.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <CaregiverPageTitle title="가용시간 관리" subtitle="근무 가능한 시간을 드래그하면 바로 등록됩니다." action={<button onClick={() => { setMessage(""); setModal({ item: null }); }} disabled={status !== "ok" || autoSaving || Boolean(pendingSelection)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">＋ 가용시간 등록</button>} />
      {api.isDemo && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">체험 모드: 가용시간은 현재 체험 중에만 유지됩니다. 화면의 새로고침 버튼이나 메뉴 이동 후에도 남지만, 브라우저 새로고침·로그아웃 시 초기화됩니다. 실제 DB에는 저장하지 않습니다.</p>}
      {message && <p role="status" className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p>}
      {saveError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{saveError}</p>}
      {autoSaving && <p role="status" className="text-sm text-teal-700">가용시간 저장 중입니다...</p>}
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">내 가용시간 {status === "ok" && <span className="ml-1 text-sm text-teal-700">{items.length}건</span>}</h2><button onClick={reload} disabled={status === "loading" || autoSaving} className="text-xs font-semibold text-teal-600 disabled:opacity-50">새로고침</button></div>
        {status !== "ok" && <LoadStatus status={status} error={error} onRetry={reload} />}
        <div hidden={status !== "ok"}><fieldset disabled={autoSaving}><AvailabilityWeekView items={items} timeAdapter={timeAdapter} confirmedWork={confirmedWork} selection={pendingSelection} disabled={autoSaving} onSelect={saveSelection} onEdit={(item) => { if (savingSelection.current) return; setMessage(""); setModal({ item }); }} onDelete={(item) => { if (savingSelection.current) return; setMessage(""); setDeleteError(""); setDeleting(item); }} /></fieldset></div>
      </Panel>
      {modal && <AvailabilityFormModal item={modal.item} selection={modal.selection} timeAdapter={timeAdapter} careworkerNo={careworkerNo} onClose={() => setModal(null)} onSaved={saved} api={api} />}
      {deleting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-labelledby="availability-delete-title" className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-700 shadow-2xl"><h2 id="availability-delete-title" className="font-display text-lg font-bold text-slate-900">가용시간 삭제 확인</h2><p className="mt-3 text-sm leading-6">{deleting.availableDate} · {deleting.startTime} ~ {deleting.endTime} 가용시간을 삭제하시겠습니까?</p><p className="mt-2 text-xs text-red-600">삭제한 가용시간은 되돌릴 수 없습니다.</p>{deleteError && <p role="alert" className="mt-3 text-xs font-semibold text-rose-600">{deleteError}</p>}<div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleting(null)} disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold disabled:opacity-50">취소</button><button autoFocus onClick={remove} disabled={busy || (api.isDemo && !api.demoAvailability)} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{busy ? "삭제 중..." : api.isDemo ? "체험에서 제거" : "삭제 확인"}</button></div></div></div>}
    </div>
  );
}
