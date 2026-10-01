// 화면이 백엔드 데이터를 불러오는 중이거나, 불러오기에 실패했을 때 보여주는 안내
export default function LoadStatus({ status, onRetry }) {
    if (status === "loading") {
        return <div className="grid place-items-center py-24 text-sm text-slate-400">백엔드에서 데이터를 불러오는 중입니다...</div>;
    }
    return (
        <div className="mx-auto max-w-md py-24 text-center">
            <p className="text-sm font-bold text-red-600">백엔드에 연결할 수 없습니다.</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">서버(localhost:8080)가 실행 중인지, DB가 켜져 있는지 확인한 뒤 다시 시도해주세요.</p>
            <button onClick={onRetry} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700">다시 불러오기</button>
        </div>
    );
}
