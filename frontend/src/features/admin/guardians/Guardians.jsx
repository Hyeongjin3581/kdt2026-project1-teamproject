import { Fragment, useEffect, useMemo, useState } from "react";
import axios from "axios";
import SectionTitle from "../../../components/common/SectionTitle";
import Panel from "../../../components/common/Panel";
import Badge from "../../../components/common/Badge";
import { useCenter, inCenter } from "../../../context/CenterContext";
import LoadStatus from "../../../components/common/LoadStatus";
import { buildAdminModel, emptyModel, emptyRaw } from "../../../utils/adminAdapters";

export default function Guardians() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const center = useCenter();
  const [model, setModel] = useState(emptyModel);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);

  // 보호자 관리 화면에 필요한 목록을 axios로 조회 : axios.get("통신할주소", { 옵션 }) → response.data
  async function loadData() {
    setStatus("loading");
    try {
      const [careworkersRes, guardiansRes, recipientsRes, usersRes] = await Promise.all([
        axios.get("/api/careworkers", { withCredentials: true }),
        axios.get("http://localhost:8080/guardian", { withCredentials: true }),
        axios.get("http://localhost:8080/carerecipient", { withCredentials: true }),
        axios.get("/user", { withCredentials: true }).catch(() => ({ data: [] })),
      ]);
      // 수급자별 방문 요청, 센터별 근무기록
      const [requestLists, reportLists] = await Promise.all([
        Promise.all(recipientsRes.data.map((r) =>
          axios.get("/request/carerecipient", { params: { carerecipient_no: r.careRecipientNo }, withCredentials: true }).catch(() => ({ data: [] }))
        )),
        Promise.all([...new Set(careworkersRes.data.map((c) => c.centerNo))].map((no) =>
          axios.get("/careworkerreport/center", { params: { center_no: no }, withCredentials: true }).catch(() => ({ data: [] }))
        )),
      ]);
      setModel(buildAdminModel({
        ...emptyRaw,
        careworkers: careworkersRes.data, guardians: guardiansRes.data, recipients: recipientsRes.data, users: usersRes.data,
        requests: requestLists.flatMap((res) => res.data),
        reports: reportLists.flatMap((res) => res.data),
      }));
      setStatus("ok");
    } catch (error) {
      console.error("보호자 관리 조회 실패:", error);
      setLoadError(error);
      setStatus("error");
    }
  }
  useEffect(() => { loadData(); }, []);
  const { guardians } = model;
  const visible = useMemo(() => guardians.filter(inCenter(center)).filter((g) => `${g.name}${g.tel}${g.recipients.map((r) => r.name).join("")}`.includes(q)), [q, center, guardians]);
  const refresh = () => {
    setQ("");
    setOpen(null);
    loadData();
  };
  if (status !== "ok") return <LoadStatus status={status} onRetry={loadData} error={loadError} />;
  return (
    <div className="space-y-5">
      <SectionTitle title="보호자 관리" subtitle="서비스에 로그인하는 보호자 계정 목록입니다. 한 보호자는 한 명 이상의 수급자와 연결될 수 있습니다." action={<button onClick={refresh} className="rounded-lg border border-teal-200 bg-white px-4 py-2.5 text-sm font-bold text-teal-700 transition hover:bg-teal-50">↻ 새로고침</button>} />
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="보호자명, 연락처, 연결된 수급자 검색" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-80" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400"><tr>{["보호자명", "연락처", "연결된 수급자", "관계", "가입일", "상태", ""].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {visible.map((g) => (
                <Fragment key={g.id}>
                  <tr className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-5 py-4"><b className="text-slate-800">{g.name}</b></td>
                    <td className="px-5 py-4 font-mono text-slate-600">{g.tel}</td>
                    <td className="px-5 py-4 text-slate-700">{g.recipients[0]?.name ?? "-"}{g.recipients.length > 1 && <span className="ml-1 rounded bg-teal-50 px-1.5 py-0.5 text-[11px] font-bold text-teal-700">+{g.recipients.length - 1}</span>}</td>
                    <td className="px-5 py-4 text-slate-600">{g.relation}</td>
                    <td className="px-5 py-4 font-mono text-slate-500">{g.joined}</td>
                    <td className="px-5 py-4"><Badge tone={g.tone}>{g.status}</Badge></td>
                    <td className="px-5 py-4"><button onClick={() => setOpen(open === g.id ? null : g.id)} className="text-xs font-bold text-teal-600 hover:underline">{open === g.id ? "닫기" : "연결 수급자 보기"} {open === g.id ? "▴" : "▾"}</button></td>
                  </tr>
                  {open === g.id && (
                    <tr className="border-t border-slate-100 bg-slate-50/60">
                      <td colSpan={7} className="px-5 py-4">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">{g.name} 보호자와 연결된 수급자 {g.recipients.length}명</p>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {g.recipients.map((r) => (
                            <div key={r.name} className="rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{r.name[0]}</div><b className="text-sm text-slate-800">{r.name} <span className="font-normal text-slate-400">수급자</span></b></div>
                              <div className="mt-3 space-y-1 text-xs">
                                <div className="flex justify-between"><span className="text-slate-400">거주 지역</span><span className="text-slate-600">{r.area}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">담당 요양보호사</span><b className="text-slate-700">{r.cg}</b></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {visible.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">선택한 센터에 등록된 보호자가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
