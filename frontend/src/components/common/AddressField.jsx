import { useState } from "react";

const POSTCODE_SRC = "//t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

// 카카오(다음) 우편번호 서비스 스크립트를 한 번만 불러온다 (API 키 불필요)
function loadPostcode() {
    return new Promise((resolve, reject) => {
        if (window.daum?.Postcode) return resolve();
        const exists = document.querySelector(`script[src="${POSTCODE_SRC}"]`);
        const script = exists ?? document.createElement("script");
        script.addEventListener("load", () => resolve());
        script.addEventListener("error", () => reject(new Error("우편번호 서비스를 불러오지 못했습니다.")));
        if (!exists) { script.src = POSTCODE_SRC; document.head.appendChild(script); }
    });
}

// 주소 검색 + 상세 주소 입력 : 저장값은 "기본 주소, 상세 주소" 한 문자열 (백엔드 주소 컬럼이 하나라서)
// value : 합쳐진 주소 문자열, onChange : 합쳐진 문자열을 돌려준다
export default function AddressField({ label = "주소", value, onChange, className = "", required = false }) {
    const [base, setBase] = useState(() => (value ?? "").split(", ")[0]);
    const [detail, setDetail] = useState(() => (value ?? "").split(", ").slice(1).join(", "));
    const [error, setError] = useState("");
    const field = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

    const emit = (nextBase, nextDetail) => onChange(nextDetail.trim() ? `${nextBase}, ${nextDetail.trim()}` : nextBase);

    const search = async () => {
        try {
            await loadPostcode();
            new window.daum.Postcode({
                oncomplete: (data) => {
                    const picked = data.roadAddress || data.jibunAddress;
                    setBase(picked);
                    setError("");
                    emit(picked, detail);
                },
            }).open();
        } catch (e) {
            console.error(e);
            setError("주소 검색을 불러오지 못했습니다. 인터넷 연결을 확인해주세요.");
        }
    };

    return (
        <div className={className}>
            <span className="block text-xs font-semibold text-slate-600">{label}{required && <span className="text-teal-600"> *</span>}</span>
            <div className="flex gap-2">
                <input readOnly value={base} onClick={search} placeholder="주소 검색을 눌러 선택해주세요" className={`${field} cursor-pointer bg-slate-50`} />
                <button type="button" onClick={search} className="mt-1.5 shrink-0 rounded-lg border border-teal-200 px-3 text-xs font-bold text-teal-700 transition hover:bg-teal-50">주소 검색</button>
            </div>
            <input value={detail} onChange={(e) => { setDetail(e.target.value); emit(base, e.target.value); }} placeholder="상세 주소 (동·호수 등)" className={field} />
            {error && <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
        </div>
    );
}
