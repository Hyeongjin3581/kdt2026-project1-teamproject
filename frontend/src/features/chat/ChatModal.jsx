import ChatRoom from "./ChatRoom";

export default function ChatModal({ roomId, title, onClose }) {
    function stopClick(e) {
        e.stopPropagation();   // 팝업 안쪽을 눌러도 닫히지 않게
    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-md" onClick={stopClick}>
                <div className="flex items-center justify-between text-white">
                    <span className="text-sm font-bold">{title}</span>
                    <button type="button" onClick={onClose}
                            className="rounded-lg bg-white/90 px-3 py-1 text-xs font-bold text-slate-700">
                        닫기
                    </button>
                </div>
                <ChatRoom roomId={String(roomId)} />
            </div>
        </div>
    );
}