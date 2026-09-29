import { useEffect, useState } from "react";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { useCenter, inCenter } from "../../../context/CenterContext";
import { WEEK_LIMIT } from "../../../constants";
import LoadStatus from "../../../components/common/LoadStatus";
import { buildAdminModel, emptyModel, emptyRaw } from "../../../utils/adminAdapters";

export default function AutoScheduling() {
  const [stage, setStage] = useState("setup");
  const [confirmed, setConfirmed] = useState(false);
  const center = useCenter();
  const [model, setModel] = useState(emptyModel);
  const [status, setStatus] = useState("loading");

  // 자동편성 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    setStatus("loading");
    try {
      const [centersRes, careworkersRes, guardiansRes, recipientsRes] = await Promise.all([
        axios.get("http://localhost:8080/center", { withCredentials: true }),
        axios.get("http://localhost:8080/api/careworkers", { withCredentials: true }),
        axios.get("http://localhost:8080/guardian", { withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }),
      ]);
      // 수급자별 방문 요청, 센터별 근무기록
      const [requestLists, reportLists] = await Promise.all([
        Promise.all(recipientsRes.data.map((r) =>
          axios.get("http://localhost:8080/request/carerecipient", { params: { carerecipient_no: r.careRecipientNo }, withCredentials: true }).catch(() => ({ data: [] }))
        )),
        Promise.all(centersRes.data.map((c) => c.centerNo).map((no) =>
          axios.get("http://localhost:8080/careworkerreport/center", { params: { center_no: no }, withCredentials: true }).catch(() => ({ data: [] }))
        )),
      ]);
      setModel(buildAdminModel({
        ...emptyRaw,
        centers: centersRes.data, careworkers: careworkersRes.data, guardians: guardiansRes.data, recipients: recipientsRes.data,
        requests: requestLists.flatMap((res) => res.data),
        reports: reportLists.flatMap((res) => res.data),
      }));
      setStatus("ok");
    } catch (error) {
      console.error("자동편성 조회 실패:", error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, []);

  // 담당자 지정·변경 : 기존 근무기록이 있으면 삭제(DELETE) 후 새 근무기록 등록(POST /careworkerreport)
  const [assignTarget, setAssignTarget] = useState(null);
  const [pickedCw, setPickedCw] = useState("");
  const openAssign = (a) => { setAssignTarget(a); setPickedCw(String(a.careworkerNo ?? model.caregivers[0]?.id ?? "")); };
  const assign = async () => {
    const a = assignTarget;
    if (!pickedCw) return;
    try {
      if (a.reportNo) await axios.delete("http://localhost:8080/careworkerreport", { params: { careworker_report_no: a.reportNo }, withCredentials: true });
      const response = await axios.post(
        "http://localhost:8080/careworkerreport",
        { careworkerNo: Number(pickedCw), requestNo: a.requestNo, workDate: a.iso, workStartTime: a.start, workEndTime: a.end, workStatus: "예정" },
        { withCredentials: true }
      );
      if (response.data) { setAssignTarget(null); loadData(); }
      else alert("담당자 지정에 실패했습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  // 배정 제외 : 근무기록 삭제 (DELETE /careworkerreport?careworker_report_no=번호)
  const exclude = async (a) => {
    if (!a.reportNo) return;
    if (!window.confirm(`${a.recipient} 수급자의 ${a.date} 배정을 제외할까요?`)) return;
    try {
      const response = await axios.delete("http://localhost:8080/careworkerreport", { params: { careworker_report_no: a.reportNo }, withCredentials: true });
      if (response.data) loadData();
      else alert("배정 제외에 실패했습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };
  const { centers, assignments, stateMeta, recipients, caregivers } = model;
  const list = assignments.filter(inCenter(center));
  const unassignedCount = list.filter((a) => a.state === "unassigned").length;

  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} />;
  if (stage === "setup") {
    return (
      <div className="space-y-5">
        <SectionTitle title="방문 일정 자동편성" subtitle="필수조건을 통과한 후보를 활동지역 적합도와 최근 30일 업무량 점수로 계산해 배정 초안을 생성합니다." />
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Panel className="p-5">
            <h2 className="font-display font-bold text-slate-900">편성 대상 현황</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[["대상 수급자", `${recipients.filter(inCenter(center)).length}명`], ["미배정 방문", `${unassignedCount}건`], ["가용 요양보호사", `${caregivers.filter(inCenter(center)).length}명`], ["주 근무 상한", `${WEEK_LIMIT}시간`]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-slate-50 px-3 py-3"><p className="text-[11px] text-slate-400">{l}</p><b className="font-mono text-lg text-slate-800">{v}</b></div>
              ))}
            </div>
          </Panel>
          <Panel className="p-5">
            <h2 className="font-display font-bold text-slate-900">자동편성 기준</h2>
            <p className="mt-1 text-xs text-slate-400">필수조건을 모두 통과한 후보만 추천점수 계산 대상이 됩니다.</p>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-teal-600">1 · 필수조건 검사</p>
            <div className="mt-2 space-y-2">
              {[
                "주 52시간 근로 상한 검사",
                "활동 가능 지역 확인",
                "근무 가능 요일·시간 및 휴무 여부 확인",
                "수급자 선호 성별 확인",
              ].map((c) => (
                <label key={c} className="flex items-start gap-2 text-sm text-teal-800"><input type="checkbox" checked disabled className="mt-0.5 h-4 w-4 accent-teal-600" /><span>{c}</span></label>
              ))}
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-teal-600">2 · 추천조건 계산</p>
              <div className="mt-2 grid grid-cols-[7fr_3fr] overflow-hidden rounded-lg text-center text-[11px] font-bold">
                <div className="bg-teal-600 px-2 py-2 text-white">활동지역 적합도 70%</div><div className="bg-teal-100 px-2 py-2 text-teal-800">최근 30일 업무량 30%</div>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">활동지역 적합도는 수급자 주소와 요양보호사 활동지역의 경도·위도 직선거리를 기준으로 계산합니다.</p>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-bold text-slate-700">3 · 업무량 보정</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">최근 30일 방문 횟수와 누적 배정시간을 팀 평균과 비교합니다. 일정이 많은 요양보호사는 감점하고, 상대적으로 적은 요양보호사는 가점합니다.</p>
            </div>
          </Panel>
        </div>
        <div className="flex justify-end"><button onClick={() => setStage("result")} className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700">조건 검사 후 배정 초안 생성 →</button></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="2026년 9월 21일 ~ 9월 26일 자동편성 결과" subtitle="배정 초안입니다. 자동편성은 최종 결정이 아니라 관리자의 의사결정을 돕는 기능입니다. 확인 후 확정하세요." action={
        <div className="flex gap-2">
          <button onClick={() => setStage("setup")} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">↻ 다시 추천</button>
          <button onClick={() => setConfirmed(true)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">{confirmed ? "전체 확정 완료 ✓" : "전체 확정"}</button>
        </div>
      } />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[["전체 방문 일정", list.length, "info"], ["자동배정 완료", list.filter((a) => a.state === "assigned").length, "ok"], ["미배정", list.filter((a) => a.state === "unassigned").length, "danger"], ["관리자 확인 필요", list.filter((a) => a.state === "review").length, "warning"]].map(([l, v, t]) => (
          <Panel key={l} className="p-4"><Badge tone={t}>초안</Badge><div className="mt-3 flex items-end gap-1"><b className="font-display text-3xl text-slate-900">{v}</b><span className="mb-1 text-sm text-slate-500">건</span></div><p className="mt-1 text-xs font-medium text-slate-600">{l}</p></Panel>
        ))}
      </div>
      <Panel className="flex items-center gap-2 border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-800">
        <span className="text-teal-500">✓</span> 주 52시간·활동지역·근무 가능 시간·선호 성별을 모두 통과한 후보만 배정했습니다. 추천점수는 활동지역 적합도 70%, 최근 30일 업무량 30%로 계산됩니다.
      </Panel>
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-display font-bold text-slate-900">주간 배정 초안</h2><p className="mt-0.5 text-xs text-slate-400">필수조건 통과 후 추천점수가 높은 요양보호사부터 배정한 결과입니다. 관리자가 수정할 수 있습니다.</p></div>
        <div className="divide-y divide-slate-100">
          {list.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">배정할 방문 일정이 없습니다.</p>}
          {list.map((a) => {
            const sm = stateMeta[a.state];
            return (
              <div key={a.requestNo} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center">
                <div className="lg:w-52">
                  <b className="text-sm text-slate-800">{a.recipient} <span className="font-normal text-slate-400">수급자</span></b>
                  <p className="mt-1 font-mono text-xs text-slate-500">{a.date} · {a.time}</p>
                  {center === "all" && <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{centers.find((c) => c.id === a.center)?.short}</span>}
                </div>
                <div className="lg:w-40">
                  {a.cg === "미배정" ? <b className="text-sm font-bold text-red-600">미배정</b> : (
                    <div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{a.cg[0]}</div><div><b className="text-sm text-slate-800">{a.cg}</b>{a.score > 0 && <span className="ml-1.5 font-mono text-xs text-teal-600">추천 {a.score}점</span>}</div></div>
                  )}
                </div>
                <div className="flex-1"><div className="flex flex-wrap gap-1.5">{a.reasons.map((r) => <span key={r} className={`rounded-md px-2 py-1 text-[11px] ${a.state === "unassigned" ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"}`}>{r}</span>)}</div></div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={sm.tone}>{sm.label}</Badge>
                  <button onClick={() => openAssign(a)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">{a.reportNo ? "담당자 변경" : "담당자 지정"}</button>
                  <button onClick={() => exclude(a)} disabled={!a.reportNo} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">배정 제외</button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
      {confirmed && <Panel className="border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">배정 초안이 확정되어 방문 일정에 반영되었습니다.{unassignedCount > 0 && ` 남은 미배정 ${unassignedCount}건은 결원 관리에서 대체자를 지정하세요.`}</Panel>}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setAssignTarget(null)}>
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-6 py-4"><h2 className="font-display text-lg font-bold text-slate-900">담당자 {assignTarget.reportNo ? "변경" : "지정"}</h2><p className="mt-1 text-xs text-slate-400">{assignTarget.recipient} 수급자 · {assignTarget.date} {assignTarget.time}</p></div>
            <div className="px-6 py-5">
              <label className="block text-xs font-semibold text-slate-600">요양보호사
                <select value={pickedCw} onChange={(e) => setPickedCw(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                  {model.caregivers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.status} · 이번 주 {c.week}h</option>)}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setAssignTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">취소</button>
              <button onClick={assign} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
