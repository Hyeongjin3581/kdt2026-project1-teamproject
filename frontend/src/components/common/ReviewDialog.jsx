import { useEffect, useId, useRef } from "react";

// 두 후기 모달에서 닫기, 초점 이동, 키보드 조작을 함께 사용한다.
export default function ReviewDialog({ title, busy = false, onClose, children }) {
  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busy) onClose();
      }
      if (event.key === "Tab") {
        const buttons = dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!first) { event.preventDefault(); dialogRef.current.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [busy, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => { if (!busy) onClose(); }}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white text-slate-700 shadow-2xl outline-none" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h2 id={titleId} className="font-display text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" aria-label="닫기" onClick={onClose} disabled={busy} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
