export default function CaregiverCenterSelect({ centers = [], value = "", onChange, loading = false, error = "", connected = false, disabled = false, onRetry }) {
  const availableCenters = centers.filter((center) => Number.isInteger(center.centerNo) && center.centerNo > 0 && center.centerName);
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600">소속 센터 <span className="text-teal-600">*</span>
        <select required value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled || loading || Boolean(error) || !availableCenters.length} aria-describedby="caregiver-center-message" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-500">
          <option value="">{loading ? "센터 목록을 불러오는 중..." : availableCenters.length ? "소속 센터를 선택해주세요" : "선택 가능한 센터가 없습니다"}</option>
          {availableCenters.map((center) => <option key={center.centerNo} value={center.centerNo}>{center.centerName}</option>)}
        </select>
      </label>
      <div id="caregiver-center-message" className="mt-2 text-xs leading-5">
        {error ? <div role="alert" className="text-rose-600">{error}{onRetry && <button type="button" onClick={onRetry} disabled={loading || disabled} className="ml-2 font-bold underline">다시 불러오기</button>}</div> : loading ? <p role="status" className="text-slate-500">가입 가능한 센터를 확인하고 있습니다.</p> : !availableCenters.length ? <p className="text-slate-500">등록된 센터가 없습니다.{!connected && " 서버의 센터 목록 연결 대기 중입니다."}</p> : <p className="text-slate-500">선택한 센터의 관리자가 가입 정보를 확인합니다.</p>}
      </div>
    </div>
  );
}
