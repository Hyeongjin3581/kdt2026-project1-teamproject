import { useEffect, useState } from "react";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { WEEK_LIMIT } from "../../../constants";
import { useCenter, inCenter } from "../../../context/CenterContext";
import LoadStatus from "../../../components/common/LoadStatus";
import { buildAdminModel, emptyModel, emptyRaw } from "../../../utils/adminAdapters";
import CaregiverRecord from "./CaregiverRecord";
import CaregiverFormModal from "./CaregiverFormModal";
import PendingApprovalModal from "./PendingApprovalModal";

export default function Caregivers() {
  const [recordId, setRecordId] = useState(null);
  const [formTarget, setFormTarget] = useState(null); // null: 닫힘, 요양보호사 DTO: 수정
  const [approvalOpen, setApprovalOpen] = useState(false); // 가입 승인 창
  const [pendingCount, setPendingCount] = useState(0);      // 승인 대기 건수 (0 이면 표시 없음)
  const [model, setModel] = useState(emptyModel);
  const [issues, setIssues] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);

  // 요양보호사 관리 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    const failed = [];
    const optionalError = (error) => {
      failed.push(error);
      return { data: [] };
    };
    setIssues([]);
    setStatus("loading");
    try {
      const [centersRes, careworkersRes, recipientsRes] = await Promise.all([
        axios.get("/center", { withCredentials: true }).catch(optionalError),
        axios.get("/api/careworkers", { withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }).catch(optionalError),
      ]);
      // 수급자별 방문 요청, 센터별 근무기록
      const [requestLists, reportLists] = await Promise.all([
        Promise.all(recipientsRes.data.map((r) =>
          axios.get("/request/carerecipient", { params: { carerecipient_no: r.careRecipientNo }, withCredentials: true }).catch(optionalError)
        )),
        Promise.all([...new Set(careworkersRes.data.map((c) => c.centerNo))].map((no) =>
          axios.get("/careworkerreport/center", { params: { center_no: no }, withCredentials: true }).catch(optionalError)
        )),
      ]);
      setModel(buildAdminModel({
        ...emptyRaw,
        centers: centersRes.data, careworkers: careworkersRes.data, recipients: recipientsRes.data,
        requests: requestLists.flatMap((res) => res.data),
        reports: reportLists.flatMap((res) => res.data),
      }));
      setIssues(failed);
      setStatus("ok");
    } catch (error) {
      console.error("요양보호사 관리 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
    }
  }
  // 가입 승인 대기 건수 : GET /api/careworkers/pending (시스템 관리자만 가능, 권한이 없거나 실패하면 0건으로 본다)
  async function loadPendingCount() {
    try {
      const response = await axios.get("http://localhost:8080/api/careworkers/pending", { withCredentials: true });
      setPendingCount(response.data.length);
    } catch (error) {
      setPendingCount(0);
    }
  }
  useEffect(() => { loadData(); loadPendingCount(); }, []);
  const { centers, caregivers } = model;
  const record = caregivers.find((c) => c.id === recordId) ?? null;
  // 요양보호사 삭제 : DELETE /api/careworkers?careworkerNo=번호 (쿼리 파라미터로 전달)
  const removeCareworker = async (c) => {
    if (!window.confirm(`${c.name} 요양보호사를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      const response = await axios.delete("/api/careworkers", { params: { careworkerNo: c.id }, withCredentials: true });
      if (response.data) loadData();
      else alert("삭제에 실패했습니다.");
    } catch (error) {
      console.error(error);
      alert("삭제할 수 없습니다. 연결된 근무기록이 있으면 먼저 정리해야 합니다.");
    }
  };
  const center = useCenter();
  const visible = caregivers.filter(inCenter(center));
  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  return (
    <div className="space-y-5">
      <SectionTitle title="요양보호사 관리" subtitle="선택한 센터에 등록된 근무 인력입니다. 주 52시간 근로기준을 기준으로 근무시간을 관리합니다." action={
        <button onClick={() => setApprovalOpen(true)} className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition ${pendingCount > 0 ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
          요양보호사 가입 승인
          {pendingCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">✓ {pendingCount}</span>}
        </button>} />
      {issues.length > 0 && <Panel className="p-4 text-sm text-amber-800">
        <p>요양보호사 목록은 조회했습니다. 추가 정보 조회 실패로 근무시간·배정 건수·근무 기록은 확인할 수 없습니다.</p>
        {issues.map((issue, index) => <p key={index} className="mt-1 text-xs">{issue.config?.url} · {issue.response ? `HTTP ${issue.response.status}` : "응답 없음"}</p>)}
        <button onClick={loadData} className="mt-2 font-bold text-teal-700">다시 불러오기</button>
      </Panel>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((c) => {
          const pct = Math.min(100, (c.week / WEEK_LIMIT) * 100);
          const bar = c.week >= WEEK_LIMIT ? "bg-red-500" : c.week >= 48 ? "bg-amber-500" : "bg-teal-500";
          return (
            <Panel key={c.id} className="p-5 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-teal-100 font-display text-lg font-bold text-teal-700">{c.name[0]}</div>
                  <div><b className="text-slate-900">{c.name}</b><p className="mt-0.5 text-xs text-slate-400">{c.gender}{center === "all" && ` · ${centers.find((x) => x.id === c.center)?.short}`}</p></div>
                </div>
                <Badge tone={issues.length ? "neutral" : c.tone}>{issues.length ? c.raw.careworkerState : c.status}</Badge>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">근무 가능 요일 · <b className="text-slate-700">{c.days}</b></div>
              <div className="mt-4">
                <div className="flex items-end justify-between"><span className="text-[11px] text-slate-400">이번 주 근무시간</span><b className={`font-mono text-sm ${c.week >= WEEK_LIMIT ? "text-red-600" : c.week >= 48 ? "text-amber-600" : "text-slate-800"}`}>{issues.length ? "조회 불가" : `${c.week} / ${WEEK_LIMIT}시간`}</b></div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${bar}`} style={{ width: `${issues.length ? 0 : pct}%` }} /></div>
              </div>
              <div className="mt-4 text-center">
                <b className="font-mono text-lg text-slate-800">{c.month}</b><p className="text-[11px] text-slate-400">이번 달 배정 건수</p>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
                <button disabled={issues.length > 0} onClick={() => setRecordId(c.id)} className="rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">근무 기록 보기</button>
                <button onClick={() => setFormTarget(c.raw)} className="rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-50">수정</button>
                <button onClick={() => removeCareworker(c)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50">삭제</button>
              </div>
            </Panel>
          );
        })}
      </div>
      {visible.length === 0 && <Panel className="p-10 text-center text-sm text-slate-400">선택한 센터에 등록된 요양보호사가 없습니다.</Panel>}
      {record && <CaregiverRecord c={record} onClose={() => setRecordId(null)} onChanged={loadData} />}
      {approvalOpen && <PendingApprovalModal centers={centers} onClose={() => setApprovalOpen(false)} onApproved={() => { loadData(); loadPendingCount(); }} />}
      {formTarget && <CaregiverFormModal careworker={formTarget} onClose={() => setFormTarget(null)} onSaved={() => { setFormTarget(null); loadData(); }} />}
    </div>
  );
}
