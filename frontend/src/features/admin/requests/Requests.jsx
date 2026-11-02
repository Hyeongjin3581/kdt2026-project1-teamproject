//
import { useEffect, useState } from "react";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { useCenter, inCenter } from "../../../context/CenterContext";
import LoadStatus from "../../../components/common/LoadStatus";
import { buildAdminModel, emptyModel, emptyRaw } from "../../../utils/adminAdapters";
import useNotifyRefresh from "../useNotifyRefresh";
import Pagination from "../../../components/common/Pagination";
import { usePagination } from "../../../utils/usePagination";

// 요청 상태별 탭 : 신청(미배정) → 배정중(요양보호사 수락 대기) → 배정완료(수락)
const tabs = [
  { id: "all", label: "전체" },
  { id: "unassigned", label: "신청 (미배정)" },
  { id: "pending", label: "배정중 (수락 대기)" },
  { id: "assigned", label: "배정완료" },
];

// 한 번에 신청한 날짜(requestGroup 이 같은 요청)를 한 줄로 묶는다.
// 같은 묶음이라도 상태나 담당자가 다르면 다른 줄로 나눈다 (예 : 하루만 거절돼 다시 '신청'이 된 날)
// 묶음 번호가 없는 예전 신청은 지금처럼 한 건씩 한 줄
function groupRows(items) {
  const rows = [];
  const byKey = new Map();
  items.forEach((a) => {
    const key = a.requestGroup ? `${a.requestGroup}|${a.state}|${a.careworkerNo ?? ""}` : `req-${a.requestNo}`;
    if (!byKey.has(key)) {
      const row = { key, members: [] };
      byKey.set(key, row);
      rows.push(row);
    }
    byKey.get(key).members.push(a);
  });
  return rows.map(({ key, members }) => {
    const first = members[0];
    const last = members[members.length - 1];
    const sameTime = members.every((m) => m.time === first.time);
    return {
      ...first,
      key,
      members,
      date: members.length > 1 ? `${first.date} ~ ${last.date}` : first.date,
      days: members.length, // 묶인 날짜 수 (1 이면 묶음 아님)
      time: sameTime ? first.time : `${first.time} 외`,
      reasons: [...new Set(members.flatMap((m) => m.reasons))],
    };
  });
}

export default function Requests() {
  const center = useCenter();
  const [model, setModel] = useState(emptyModel);
  const [status, setStatus] = useState("loading");
  const [tab, setTab] = useState("all");

  // 요청 관리 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  // silent : 새 알림으로 목록만 다시 받을 때는 로딩 화면 없이 데이터만 바꾼다 (보던 화면과 열어 둔 창을 유지)
  async function loadData({ silent = false } = {}) {
    if (!silent) setStatus("loading");
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
          axios.get("http://localhost:8080/request/carerecipient", { params: { careRecipientNo: r.careRecipientNo }, withCredentials: true }).catch(() => ({ data: [] }))
        )),
        Promise.all(centersRes.data.map((c) => c.centerNo).map((no) =>
          axios.get("http://localhost:8080/careworkerreport/center", { params: { centerNo: no }, withCredentials: true }).catch(() => ({ data: [] }))
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
      console.error("요청 관리 조회 실패:", error);
      if (!silent) setStatus("error");      // 조용한 갱신이 실패하면 보던 목록은 그대로 둔다
    }
  }
  useEffect(() => { loadData(); }, []);
  useNotifyRefresh("requests", () => loadData({ silent: true }));   // 새 서비스 신청 알림이 오면 목록을 다시 불러온다

  // 자동배정(후보 추천) : GET /careworkerreport/candidates?requestNo=번호 → 상위 3명 [{ careworkerNo, careworkerName, distanceKm, workCount, continuityCount, totalScore }]
  // 직접 선택 목록 : GET /careworkerreport/available?requestNo=번호 → 필수 조건(근무중·성별·근무가능 시간·일정 겹침 없음)을 통과한 요양보호사 전체 [{ careworkerNo, careworkerName, ... }]
  // 이 API 가 아직 없는 서버면 전체 요양보호사 목록에서 고르게 한다.
  const [assignTarget, setAssignTarget] = useState(null);
  const [candidates, setCandidates] = useState({ loading: false, list: [], noApi: false });
  const [available, setAvailable] = useState(null); // null: 서버에 API 없음(전체에서 선택), 배열: 필수 조건을 통과한 요양보호사
  const [manual, setManual] = useState(false);
  const [pickedCw, setPickedCw] = useState("");
  // 묶음(한 번에 신청한 날짜)이면 서버가 '모든 날짜에 갈 수 있는 사람'으로 후보를 골라 주고,
  // 배정하면 같은 묶음의 나머지 날짜도 같은 요양보호사로 함께 배정한다 (AutoAssignService · assignCareworker)
  const openAssign = async (a) => {
    const first = (a.members ?? [a])[0];
    setAssignTarget(a);
    setPickedCw(String(a.careworkerNo ?? ""));
    setManual(false);
    setCandidates({ loading: true, list: [], noApi: false });
    setAvailable(null);
    // 추천 상위 3명과 필수 조건 통과 목록을 함께 조회한다 (둘 중 하나가 실패해도 다른 쪽은 쓴다)
    const [candidatesRes, availableRes] = await Promise.all([
      axios.get("http://localhost:8080/careworkerreport/candidates", { params: { requestNo: first.requestNo }, withCredentials: true }).catch(() => null),
      axios.get("http://localhost:8080/careworkerreport/available", { params: { requestNo: first.requestNo }, withCredentials: true }).catch(() => null),
    ]);
    setAvailable(Array.isArray(availableRes?.data) ? availableRes.data : null);
    setCandidates(candidatesRes ? { loading: false, list: Array.isArray(candidatesRes.data) ? candidatesRes.data.slice(0, 3) : [], noApi: false } : { loading: false, list: [], noApi: true });
  };
  // 직접 선택 목록에 보여 줄 요양보호사 : 필수 조건을 통과한 사람만 (API 가 없는 서버면 전체)
  const pickOptions = available ? available.map((c) => ({ id: c.careworkerNo, label: `${c.careworkerName} · ${c.careworkerGender} · ${c.careworkerAge}세` })) : model.caregivers.map((c) => ({ id: c.id, label: `${c.name} · ${c.status} · 이번 주 ${c.week}h` }));

  // 지정(배정) : POST /careworkerreport/assign (body { requestNo, careworkerNo }) → '배정' 근무기록 + 요청 '배정중'
  // 같은 묶음의 나머지 '신청' 날짜는 서버가 같은 요양보호사로 함께 배정한다 (그날 못 가면 그 날짜만 '신청'으로 남음)
  // 담당자 변경이면 기존 근무기록을 지우고 요청을 '신청'으로 되돌린 뒤 배정한다 (/assign 은 '신청' 상태만 받음)
  const assign = async () => {
    const a = assignTarget;
    if (!pickedCw) { alert("요양보호사를 선택해주세요."); return; }
    const members = a.members ?? [a];
    try {
      for (const m of members) {
        if (!m.reportNo) continue;
        await axios.delete("http://localhost:8080/careworkerreport", { params: { careworkersReportNo: m.reportNo }, withCredentials: true });
        await axios.put("http://localhost:8080/request", { requestState: "신청" }, { params: { requestNo: m.requestNo }, withCredentials: true });
      }
      const response = await axios.post(
        "http://localhost:8080/careworkerreport/assign",
        { requestNo: members[0].requestNo, careworkerNo: Number(pickedCw) },
        { withCredentials: true }
      );
      if (!response.data) { alert("담당자 지정에 실패했습니다. 가입 승인된 요양보호사인지 확인해주세요."); loadData(); return; }
      setAssignTarget(null);
      loadData();
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  // 배정 제외 : 근무기록 삭제 (DELETE /careworkerreport?careworkersReportNo=번호) + 요청 '신청'으로 복귀 (묶음이면 모든 날짜)
  const exclude = async (a) => {
    if (!a.reportNo) return;
    if (!window.confirm(`${a.recipient} 수급자의 ${a.date} 배정을 제외할까요?`)) return;
    try {
      let failed = 0;
      for (const m of a.members ?? [a]) {
        if (!m.reportNo) continue;
        const response = await axios.delete("http://localhost:8080/careworkerreport", { params: { careworkersReportNo: m.reportNo }, withCredentials: true });
        if (response.data) await axios.put("http://localhost:8080/request", { requestState: "신청" }, { params: { requestNo: m.requestNo }, withCredentials: true });
        else failed += 1;
      }
      loadData();
      if (failed > 0) alert("배정 제외에 실패한 날짜가 있습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  // 확정 처리 : 요양보호사가 수락하면 근무기록 '확정' + 요청 '배정완료' (묶음이면 모든 날짜)
  const confirmAssign = async (a) => {
    if (!a.reportNo) return;
    try {
      let failed = 0;
      for (const m of a.members ?? [a]) {
        if (!m.reportNo) continue;
        const response = await axios.put("http://localhost:8080/careworkerreport", null, { params: { careworkersReportNo: m.reportNo, workStatus: "확정" }, withCredentials: true });
        if (response.data) await axios.put("http://localhost:8080/request", { requestState: "배정완료" }, { params: { requestNo: m.requestNo }, withCredentials: true });
        else failed += 1;
      }
      loadData();
      if (failed > 0) alert("확정 처리에 실패한 날짜가 있습니다.");
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  const { centers, assignments, stateMeta } = model;
  // 요청 관리는 진행 중인 요청(신청·배정중·배정완료)만 다룬다. 방문이 끝난 요청은 방문 일정에서 확인
  const all = assignments.filter(inCenter(center)).filter((a) => a.requestState !== "완료");
  const count = (s) => all.filter((a) => a.state === s).length;
  const list = tab === "all" ? all : all.filter((a) => a.state === tab);
  // 한 번에 신청한 날짜는 한 줄로 (건수 카드·탭 숫자는 날짜별 요청 건수 그대로)
  const rows = groupRows(list);
  // 페이징 : 한 페이지 10줄, 탭·센터가 바뀌면 1페이지로
  const { page, setPage, totalPages, pageItems, total } = usePagination(rows, 10, [tab, center]);

  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} />;
  return (
    <div className="space-y-5">
      <SectionTitle title="요청 관리" subtitle="보호자가 신청한 방문 요청을 확인하고 요양보호사를 배정합니다. 요청 옆의 자동배정을 누르면 조건에 맞는 후보를 추천받아 지정할 수 있습니다." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[["전체 요청", all.length, "info"], ["신청 (미배정)", count("unassigned"), "danger"], ["배정중 (수락 대기)", count("pending"), "warning"], ["배정완료", count("assigned"), "ok"]].map(([l, v, t]) => (
          <Panel key={l} className="p-4"><Badge tone={t}>{l.split(" ")[0]}</Badge><div className="mt-3 flex items-end gap-1"><b className="font-display text-3xl text-slate-900">{v}</b><span className="mb-1 text-sm text-slate-500">건</span></div><p className="mt-1 text-xs font-medium text-slate-600">{l}</p></Panel>
        ))}
      </div>
      <Panel className="flex items-center gap-2 border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-800">
        <span className="text-teal-500">✓</span> 자동배정은 근무중인 요양보호사 중 선호 성별, 근무 가능 시간, 기존 일정과의 시간 충돌을 통과한 후보에게 거리 점수를 매겨 상위 3명을 보여 줍니다. 관리자가 한 명을 지정하면 요양보호사에게 수락 여부를 묻습니다.
      </Panel>
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${tab === t.id ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t.label} <span className="font-mono">{t.id === "all" ? all.length : count(t.id)}</span>
            </button>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {list.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">해당하는 요청이 없습니다.</p>}
          {pageItems.map((a) => {
            const sm = stateMeta[a.state];
            return (
              <div key={a.key} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center">
                <div className="shrink-0 lg:w-56">
                  <div className="flex items-center gap-1.5">
                    <b className="text-sm text-slate-800">{a.recipient} <span className="font-normal text-slate-400">수급자</span></b>
                    {a.days > 1 && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">{a.days}일 묶음</span>}
                  </div>
                  {a.days > 1 ? (
                    // 묶음 : 한 번에 신청한 날짜를 모두 보여 준다
                    <ul className="mt-1.5 space-y-1 border-l-2 border-teal-100 pl-3">
                      {a.members.map((m) => (
                        <li key={m.requestNo} className="flex gap-3 whitespace-nowrap font-mono text-xs">
                          <span className="text-slate-600">{m.date}</span>
                          <span className="text-slate-400">{m.time}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <p className="mt-1 whitespace-nowrap font-mono text-xs text-slate-600">{a.date}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{a.time}</p>
                    </>
                  )}
                  {center === "all" && <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{centers.find((c) => c.id === a.center)?.short}</span>}
                </div>
                <div className="shrink-0 lg:w-32">
                  {a.cg === "미배정" ? <b className="text-sm font-bold text-red-600">미배정</b> : (
                    <div className="flex items-center gap-2"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{a.cg[0]}</div><div><b className="whitespace-nowrap text-sm text-slate-800">{a.cg}</b></div></div>
                  )}
                </div>
                <div className="min-w-[8rem] flex-1"><div className="flex flex-wrap gap-1.5">{a.reasons.map((r) => <span key={r} className={`break-keep rounded-md px-2 py-1 text-[11px] ${a.state === "unassigned" ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"}`}>{r}</span>)}</div></div>
                <div className="flex flex-wrap items-center gap-2 lg:max-w-[18rem] lg:justify-end">
                  <Badge tone={sm.tone}>{sm.label}</Badge>
                  {a.state === "unassigned" && <button onClick={() => openAssign(a)} className="rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-700">자동배정</button>}
                  {a.state === "pending" && <button onClick={() => confirmAssign(a)} className="rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-teal-700">확정 처리</button>}
                  {a.state !== "unassigned" && <button onClick={() => openAssign(a)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">담당자 변경</button>}
                  {a.state !== "unassigned" && <button onClick={() => exclude(a)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">배정 제외</button>}
                </div>
              </div>
            );
          })}
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </Panel>
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setAssignTarget(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-6 py-4"><h2 className="font-display text-lg font-bold text-slate-900">{assignTarget.reportNo ? "담당자 변경" : "자동배정 · 후보 추천"}</h2><p className="mt-1 text-xs text-slate-400">{assignTarget.recipient} 수급자 · {assignTarget.date}{assignTarget.days > 1 ? ` (${assignTarget.days}일)` : ""} · {assignTarget.time}</p></div>
            <div className="space-y-3 px-6 py-5">
              {candidates.loading && <p className="text-sm text-slate-500">조건에 맞는 후보를 찾는 중입니다...</p>}
              {!candidates.loading && (assignTarget.members?.length ?? 1) > 1 && (
                <div className="rounded-lg bg-teal-50 px-3 py-2 text-xs leading-5 text-teal-800">
                  <p>한 번에 신청한 {assignTarget.members.length}일을 같은 요양보호사로 배정합니다. 모든 날짜에 갈 수 있는 사람을 우선 추천하고, 선택한 요양보호사가 갈 수 없는 날짜는 '신청'으로 남습니다.</p>
                  <ul className="mt-2 space-y-0.5 font-mono text-[11px]">
                    {assignTarget.members.map((m) => <li key={m.requestNo}>· {m.date} <span className="text-teal-600">{m.time}</span></li>)}
                  </ul>
                </div>
              )}
              {!candidates.loading && candidates.list.length > 0 && !manual && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">추천 후보 상위 {candidates.list.length}명 · 한 명을 선택하세요</p>
                  {candidates.list.map((c, i) => (
                    <button key={c.careworkerNo} onClick={() => setPickedCw(String(c.careworkerNo))} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${pickedCw === String(c.careworkerNo) ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{i + 1}</span>
                      <span className="flex-1">
                        <b className="text-sm text-slate-800">{c.careworkerName}</b>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {typeof c.distanceKm === "number" ? `거리 ${c.distanceKm.toFixed(1)}km` : ""}
                          {c.workCount !== undefined ? ` · 최근 30일 ${c.workCount}회` : ""}
                          {c.continuityCount !== undefined ? ` · 연속요양 ${c.continuityCount}회` : ""}
                        </span>
                      </span>
                      {c.totalScore !== undefined && <span className="font-mono text-sm font-bold text-teal-600">{Number(c.totalScore).toFixed(1)}점</span>}
                    </button>
                  ))}
                </div>
              )}
              {!candidates.loading && available && available.length === 0 && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">이 방문 시간에 배정할 수 있는 요양보호사가 없습니다. 근무중인지, 선호 성별이 맞는지, 근무 가능 시간이 등록돼 있는지, 같은 시간에 다른 일정이 없는지를 확인해주세요.</p>}
              {!candidates.loading && available && available.length > 0 && candidates.list.length === 0 && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">추천 점수를 계산할 수 있는 후보는 없지만(주소 좌표 없음 등), 조건을 통과한 요양보호사를 아래에서 직접 선택할 수 있습니다.</p>}
              {!candidates.loading && pickOptions.length > 0 && (manual || candidates.list.length === 0) && (
                <label className="block text-xs font-semibold text-slate-600">요양보호사 직접 선택 <span className="font-normal text-slate-400">{available ? `(조건을 통과한 ${pickOptions.length}명)` : ""}</span>
                  <select value={pickedCw} onChange={(e) => setPickedCw(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                    <option value="">선택하세요</option>
                    {pickOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </label>
              )}
              {!candidates.loading && candidates.list.length > 0 && <button onClick={() => setManual((m) => !m)} className="text-xs font-semibold text-teal-600 hover:underline">{manual ? "← 추천 후보로 돌아가기" : "추천 후보 말고 직접 선택하기"}</button>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setAssignTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">취소</button>
              <button onClick={assign} disabled={!pickedCw} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">배정하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
