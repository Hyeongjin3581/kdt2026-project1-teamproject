import { useEffect, useState } from "react";
import axios from "axios";
import Panel from "../../../components/common/Panel";
import LoadStatus from "../../../components/common/LoadStatus";
import CaregiverPageTitle from "../CaregiverPageTitle";
import AvailabilityFormModal from "./AvailabilityFormModal";
import AvailabilityWeekView from "./AvailabilityWeekView";
import availabilityTime, { defaultAvailabilityStatus, formatUiTime, isUiTimeRange } from "./availabilityTime";
import { toHhmm } from "../../../utils/timeFormat";

// 가용시간 관리 : 근무 가능한 날짜·시간을 등록·수정·삭제한다. 시간표에서 드래그하면 바로 등록된다.
export default function CaregiverAvailability({ careworkerNo }) {
  const [items, setItems] = useState([]);               // 내 가용시간
  const [confirmedWork, setConfirmedWork] = useState([]); // 시간표에 함께 표시할 확정 근무
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [modal, setModal] = useState(null);     // { item } : 등록(item=null) / 수정
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [pendingSelection, setPendingSelection] = useState(null); // 드래그로 저장 중인 구간

  // 가용시간 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    setLoadError(null);
    try {
      const [availabilityRes, mineRes] = await Promise.all([
        axios.get("http://localhost:8080/api/caregiver-availability", { withCredentials: true }),
        axios.get("http://localhost:8080/careworkerreport/careworker", { params: { careworkerNo: careworkerNo }, withCredentials: true }),
      ]);
      // 가용시간은 전체 조회만 있어서 내 번호(caregiverNo)로 거른다
      setItems(availabilityRes.data
        .filter((a) => a.caregiverNo === careworkerNo)
        .sort((a, b) => a.availableDate.localeCompare(b.availableDate) || a.startTime - b.startTime));
      // 확정 근무를 시간표 모양 { scheduleNo, visitDate, startMinutes, endMinutes, status } 으로
      setConfirmedWork(mineRes.data
        .filter((r) => r.workStatus === "확정")
        .map((r) => ({ scheduleNo: r.careworkersReportNo, visitDate: r.workDate, startMinutes: r.workStartTime * 60, endMinutes: r.workEndTime * 60, status: "확정 근무" })));
      setStatus("ok");
      return true;
    } catch (error) {
      console.error("가용시간 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
      return false;
    }
  }
  useEffect(() => { loadData(); }, [careworkerNo]);

  // 시간표에서 드래그한 구간을 바로 등록 : POST /api/caregiver-availability (body : CaregiverAvailabilityDto)
  const saveSelection = async (selection) => {
    if (pendingSelection || !isUiTimeRange(selection.startMinutes, selection.endMinutes)) return;
    const startTime = availabilityTime.uiTimeToBackendValue(selection.startMinutes);
    const endTime = availabilityTime.uiTimeToBackendValue(selection.endMinutes);
    if (!Number.isInteger(startTime) || !Number.isInteger(endTime) || startTime >= endTime) { setSaveError("시간은 정시 단위로만 등록할 수 있습니다."); return; }
    if (items.some((a) => a.availableDate === selection.availableDate && a.startTime === startTime && a.endTime === endTime)) { setMessage("이미 등록된 가용시간입니다."); return; }
    setSaveError("");
    setMessage("");
    setPendingSelection(selection);
    try {
      const response = await axios.post("http://localhost:8080/api/caregiver-availability",
        { caregiverNo: careworkerNo, availableDate: selection.availableDate, startTime, endTime, status: defaultAvailabilityStatus },
        { withCredentials: true });
      if (response.data) {
        setMessage(`${selection.availableDate} · ${formatUiTime(selection.startMinutes)} ~ ${formatUiTime(selection.endMinutes)} 가용시간을 등록했습니다.`);
        await loadData();
      } else {
        setSaveError("가용시간을 저장하지 못했습니다. 선택 구간을 다시 확인해주세요.");
      }
    } catch (error) {
      console.error(error);
      setSaveError("서버 통신 오류가 발생했습니다.");
    } finally {
      setPendingSelection(null);
    }
  };

  // 등록·수정 창에서 저장한 뒤
  const saved = async (text) => {
    setModal(null);
    setMessage(text);
    await loadData();
  };

  // 삭제 : DELETE /api/caregiver-availability?availabilityNo=번호
  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      const response = await axios.delete("http://localhost:8080/api/caregiver-availability", { params: { availabilityNo: deleting.availabilityNo }, withCredentials: true });
      if (response.data) {
        setDeleting(null);
        setMessage("가용시간을 삭제했습니다.");
        await loadData();
      } else {
        alert("삭제하지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  return (
    <div className="space-y-5">
      <CaregiverPageTitle title="가용시간 관리" subtitle="근무 가능한 시간을 드래그하면 바로 등록됩니다. 등록한 시간에 맞춰 센터에서 방문을 배정합니다." action={<button onClick={() => { setMessage(""); setModal({ item: null }); }} disabled={Boolean(pendingSelection)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">＋ 가용시간 등록</button>} />
      {message && <p role="status" className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p>}
      {saveError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{saveError}</p>}
      {pendingSelection && <p role="status" className="text-sm text-teal-700">가용시간 저장 중입니다...</p>}
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">내 가용시간 <span className="ml-1 text-sm text-teal-700">{items.length}건</span></h2><button onClick={loadData} disabled={Boolean(pendingSelection)} className="text-xs font-semibold text-teal-600 disabled:opacity-50">새로고침</button></div>
        <fieldset disabled={Boolean(pendingSelection)}>
          <AvailabilityWeekView items={items} timeAdapter={availabilityTime} confirmedWork={confirmedWork} selection={pendingSelection} disabled={Boolean(pendingSelection)} onSelect={saveSelection}
            onEdit={(item) => { setMessage(""); setModal({ item }); }} onDelete={(item) => { setMessage(""); setDeleting(item); }} />
        </fieldset>
      </Panel>
      {modal && <AvailabilityFormModal item={modal.item} careworkerNo={careworkerNo} onClose={() => setModal(null)} onSaved={saved} />}
      {deleting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-700 shadow-2xl"><h2 className="font-display text-lg font-bold text-slate-900">가용시간 삭제 확인</h2><p className="mt-3 text-sm leading-6">{deleting.availableDate} · {toHhmm(deleting.startTime)} ~ {toHhmm(deleting.endTime)} 가용시간을 삭제하시겠습니까?</p><p className="mt-2 text-xs text-red-600">삭제한 가용시간은 되돌릴 수 없습니다.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleting(null)} disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold disabled:opacity-50">취소</button><button autoFocus onClick={remove} disabled={busy} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{busy ? "삭제 중..." : "삭제 확인"}</button></div></div></div>}
    </div>
  );
}
