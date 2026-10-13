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
import CaregiverDetailModal from "./CaregiverDetailModal";

export default function Caregivers() {
  const [recordId, setRecordId] = useState(null);
  const [detailId, setDetailId] = useState(null); // 상세 조회할 요양보호사 번호 (null 이면 닫힘)
  const [q, setQ] = useState("");                 // 검색어 (이름 · 지역 · 센터 · 근무 상태)
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
          axios.get("/request/carerecipient", { params: { careRecipientNo: r.careRecipientNo }, withCredentials: true }).catch(optionalError)
        )),
        Promise.all([...new Set(careworkersRes.data.map((c) => c.centerNo))].map((no) =>
          axios.get("/careworkerreport/center", { params: { centerNo: no }, withCredentials: true }).catch(optionalError)
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
  // 요양보호사 탈퇴 : PUT /user/state (body { userNo }) → 회원 상태를 delete 로 변경
  // 근무기록은 보존되고 , 요양보호사 목록 · 추천 · 배정에서 제외된다
  const removeCareworker = async (c) => {
    if (!window.confirm(`${c.name} 요양보호사를 탈퇴 처리할까요? 계정이 비활성화되며 근무기록은 보존됩니다.`)) return;
    try {
      const response = await axios.put("/user/state", { userNo: c.raw.userNo }, { withCredentials: true });
      if (response.data) loadData();
      else alert("탈퇴 처리에 실패했습니다. 이미 탈퇴한 계정일 수 있습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };
  const center = useCenter();
  const centerShortOf = (no) => centers.find((x) => x.id === no)?.short ?? "";
  const keyword = q.trim();
  const visible = caregivers.filter(inCenter(center))
    .filter((c) => `${c.name}${c.area}${centerShortOf(c.center)}${c.raw.careworkerState ?? ""}`.includes(keyword));
  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  return (
    <div className="space-y-5">
      <SectionTitle title="요양보호사 관리" subtitle="선택한 센터에 등록된 근무 인력입니다. 주 52시간 근로기준을 기준으로 근무시간을 관리합니다." action={
        <button onClick={() => setApprovalOpen(true)} className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition ${pendingCount > 0 ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
          요양보호사 가입 승인
          {pendingCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">✓ {pendingCount}</span>}
        </button>} />
      {/* 검색 : 보호자 관리와 같은 모양, 찾은 요양보호사의 이름을 누르면 상세 조회 */}
      <Panel className="flex flex-wrap items-center gap-3 p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="요양보호사명, 거주 지역, 센터, 근무 상태 검색" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-80" />
        <span className="text-xs text-slate-400">{keyword ? `검색 결과 ${visible.length}명` : `총 ${visible.length}명`} · 이름을 누르면 상세 정보를 볼 수 있습니다.</span>
      </Panel>
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
                {/* 이름을 누르면 요양보호사 상세 조회 */}
                <button type="button" onClick={() => setDetailId(c.id)} className="group flex items-center gap-3 text-left">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-teal-100 font-display text-lg font-bold text-teal-700">{c.name[0]}</div>
                  <div><b className="text-slate-900 group-hover:text-teal-700 group-hover:underline">{c.name}</b><p className="mt-0.5 text-xs text-slate-400">{c.gender}{center === "all" && ` · ${centers.find((x) => x.id === c.center)?.short}`}</p></div>
                </button>
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
                <button onClick={() => removeCareworker(c)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50">탈퇴</button>
              </div>
            </Panel>
          );
        })}
      </div>
      {visible.length === 0 && <Panel className="p-10 text-center text-sm text-slate-400">{keyword ? `'${keyword}' 에 해당하는 요양보호사가 없습니다.` : "선택한 센터에 등록된 요양보호사가 없습니다."}</Panel>}
      {detailId && <CaregiverDetailModal careworkerNo={detailId} stats={issues.length ? null : caregivers.find((c) => c.id === detailId)} onClose={() => setDetailId(null)} />}
      {record && <CaregiverRecord c={record} onClose={() => setRecordId(null)} onChanged={loadData} />}
      {approvalOpen && <PendingApprovalModal centers={centers} onClose={() => setApprovalOpen(false)} onApproved={() => { loadData(); loadPendingCount(); }} />}
      {formTarget && <CaregiverFormModal careworker={formTarget} onClose={() => setFormTarget(null)} onSaved={() => { setFormTarget(null); loadData(); }} />}
    </div>
  );
}
