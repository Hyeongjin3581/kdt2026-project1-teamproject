// 화면이 백엔드 데이터를 불러오는 중이거나, 불러오기에 실패했을 때 보여주는 안내
export default function LoadStatus({ status, onRetry, error }) {
    const code = error?.response?.status;
    const reason = code === 404 ? "요청한 API가 백엔드에 구현되어 있는지 확인이 필요합니다." : code >= 500 ? "백엔드가 요청을 처리하다 오류를 반환했습니다." : "";
    if (status === "loading") {
        return <div className="grid place-items-center py-24 text-sm text-slate-400">백엔드에서 데이터를 불러오는 중입니다...</div>;
    }
    return (
        <div className="mx-auto max-w-md py-24 text-center">
            <p className="text-sm font-bold text-red-600">{error?.response ? "데이터를 불러오지 못했습니다." : "백엔드에 연결할 수 없습니다."}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{error?.response ? `요청 실패: ${error.config?.url} (HTTP ${error.response.status})` : "서버(localhost:8080)가 실행 중인지, DB가 켜져 있는지 확인한 뒤 다시 시도해주세요."}</p>
            {reason && <p className="mt-2 text-xs text-slate-500">{reason}</p>}
            <button onClick={onRetry} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700">다시 불러오기</button>
        </div>
    );
}
