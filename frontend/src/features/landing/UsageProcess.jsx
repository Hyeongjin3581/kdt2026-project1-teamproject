//
import SitePage from "./SitePage";
import { PHONE } from "./SiteHeader";

// 온케어 이용 단계 (보호자 화면 흐름과 같다)
const ONCARE_STEPS = [
  { icon: "📝", title: "회원가입", desc: "보호자로 회원가입합니다. 이메일 인증만 하면 바로 가입됩니다." },
  { icon: "👵", title: "어르신 등록", desc: "돌봄을 받으실 어르신의 정보를 등록합니다." },
  { icon: "📅", title: "서비스 신청", desc: "원하는 날짜와 방문 시간을 골라 서비스를 신청합니다." },
  { icon: "☎️", title: "상담 · 계약", desc: "센터에서 연락드려 어르신 상태와 필요한 도움을 상담하고 계약합니다." },
  { icon: "🤝", title: "요양보호사 배정", desc: "방문 시간과 근무 가능 시간, 담당 이력을 살펴 꼭 맞는 요양보호사를 배정합니다." },
  { icon: "🏠", title: "방문 시작", desc: "방문 일정과 기록을 앱에서 확인하고, 요양보호사와 채팅으로 소통합니다." },
];

// 상담할 때 준비하면 좋은 것
const DOCUMENTS = ["어르신 · 보호자 신분증", "지병 · 복용 중인 약 정보", "원하는 방문 요일과 시간", "장기요양인정서 (등급이 있는 경우)"];

const FAQS = [
  { q: "장기요양등급이 없어도 이용할 수 있나요?", a: "네, 온케어는 등급과 상관없이 이용하실 수 있습니다. 다만 장기요양등급은 미리 받아 두시면 좋습니다." },
  { q: "방문 시간을 바꾸고 싶으면 어떻게 하나요?", a: "보호자 화면의 '요청 · 문의' 메뉴에서 바꾸고 싶은 방문 일정을 골라 시간 변경을 요청하시면, 센터에서 확인 후 조정해 드립니다." },
  { q: "요양보호사를 바꿀 수 있나요?", a: "'요청 · 문의' 메뉴나 대표전화로 말씀해 주세요. 어르신과 더 잘 맞는 요양보호사로 다시 배정해 드립니다." },
];

function SectionTitle({ eyebrow, title, desc }) {
  return (
    <div className="mb-10">
      <p className="font-mono text-xs font-bold tracking-[.2em] text-teal-600">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-900">{title}</h2>
      {desc && <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 lg:text-base">{desc}</p>}
    </div>
  );
}

// 방문요양 > 이용 절차 페이지 (/process)
export default function UsageProcess({ home, logout }) {
  return (
    <SitePage home={home} logout={logout} eyebrow="PROCESS" title="이용 절차" desc="회원가입부터 온케어 요양보호사가 처음 방문하는 날까지, 단계별로 안내해 드립니다.">
      {/* 온케어 이용하기 */}
      <section>
        <SectionTitle eyebrow="HOW IT WORKS" title="온케어 이용하기" desc="회원가입부터 첫 방문까지, 보호자는 온케어 화면에서 대부분의 과정을 간편하게 진행할 수 있습니다." />
        <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ONCARE_STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-5 rounded-2xl bg-gradient-to-br from-teal-50 to-white p-6 ring-1 ring-teal-100">
              <div className="flex shrink-0 flex-col items-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">{s.icon}</span>
                <span className="mt-2 font-mono text-[11px] font-bold text-teal-600">STEP {i + 1}</span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-7 text-slate-500">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 준비 서류 · 자주 묻는 질문 */}
      <section className="mt-24 grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <SectionTitle eyebrow="DOCUMENTS" title="상담 시 준비하면 좋아요" />
          <ul className="-mt-4 space-y-3">
            {DOCUMENTS.map((d) => (
              <li key={d} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-600 text-xs text-white">✓</span>{d}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-6 text-slate-400">준비되지 않았어도 상담은 먼저 받으실 수 있습니다. 대표전화 {PHONE}</p>
        </div>
        <div>
          <SectionTitle eyebrow="FAQ" title="자주 묻는 질문" />
          <div className="-mt-4 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm open:ring-1 open:ring-teal-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-800">
                  <span><span className="mr-2 text-teal-600">Q.</span>{f.q}</span>
                  <span className="text-slate-400 transition group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-7 text-slate-500"><span className="mr-2 font-bold text-slate-400">A.</span>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </SitePage>
  );
}
