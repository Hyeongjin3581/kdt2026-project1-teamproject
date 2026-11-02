//
import SitePage from "./SitePage";

// 온케어가 다른 점
const STRENGTHS = [
  { icon: "🧩", title: "조건에 맞춘 배정", desc: "어르신이 원하는 방문 시간과 요양보호사의 근무 가능 시간, 담당 이력을 함께 살펴 가장 잘 맞는 분을 배정합니다." },
  { icon: "📱", title: "보호자 앱으로 한눈에", desc: "방문 일정과 지난 방문 기록을 보호자가 언제든 확인할 수 있어, 멀리 있어도 부모님 돌봄 상황을 알 수 있습니다." },
  { icon: "💬", title: "요양보호사와 바로 소통", desc: "방문 일정에서 담당 요양보호사와 1:1 채팅으로 필요한 내용을 바로 전할 수 있습니다." },
];

// 방문요양에서 제공하는 서비스
const SERVICES = [
  { icon: "🛁", title: "신체활동 지원", items: ["세면 · 구강 관리 · 머리 감기", "옷 갈아입기 · 몸단장", "식사 도움 · 체위 변경", "화장실 이용 · 이동 도움"] },
  { icon: "🍲", title: "일상생활 지원", items: ["식사 준비 (취사)", "청소 및 주변 정돈", "세탁", "생활 환경 관리"] },
  { icon: "🤝", title: "정서 지원", items: ["말벗 · 격려 · 위로", "생활 상담", "의사소통 도움", "인지 자극 활동"] },
  { icon: "🚶", title: "개인활동 지원", items: ["병원 · 외출 동행", "장보기 등 일상 업무 대행", "산책 동행", "관공서 업무 도움"] },
];

// 이용 대상
const TARGETS = [
  { icon: "👵", title: "혼자 일상생활이 어려운 어르신", desc: "식사 · 세면 · 이동 등 일상에서 도움이 필요한 분" },
  { icon: "🏢", title: "낮 시간 돌봄이 어려운 가족", desc: "직장 등으로 부모님 곁을 지키기 어려운 보호자" },
  { icon: "🏥", title: "퇴원 후 회복 중인 어르신", desc: "집에서 안정적으로 회복할 수 있도록 돌봄이 필요한 분" },
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

// 방문요양 > 서비스 안내 페이지 (/service)
export default function ServiceGuide({ home, logout }) {
  return (
    <SitePage home={home} logout={logout} eyebrow="SERVICE" title="서비스 안내" desc="요양보호사가 어르신 댁으로 직접 찾아가, 익숙한 집에서 편안한 일상을 이어가실 수 있도록 돕습니다.">
      {/* 방문요양이란 */}
      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionTitle eyebrow="ABOUT" title="방문요양이란?" />
          <p className="-mt-4 text-base leading-8 text-slate-600">
            온케어 방문요양은 요양보호사 자격을 갖춘 전문 인력이 어르신 댁을 방문해
            신체활동과 가사활동, 정서 지원까지 일상 전반을 돌봐 드리는 서비스입니다.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            요양원에 가지 않고도 살던 집에서 생활하실 수 있고, 필요한 요일과 시간만큼 원하는 대로 이용하실 수 있습니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">등급 없이도 이용 가능</span>
            <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">자격을 갖춘 요양보호사</span>
            <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">원하는 요일 · 시간 선택</span>
          </div>
        </div>
        <div className="aspect-[4/3] rounded-3xl bg-teal-100 bg-cover bg-center shadow-xl" style={{ backgroundImage: "url(/landing-hero.jpg)" }} role="img" aria-label="요양보호사와 어르신" />
      </section>

      {/* 온케어가 다른 점 */}
      <section className="mt-24">
        <SectionTitle eyebrow="WHY ONCARE" title="온케어가 다른 점" desc="좋은 돌봄은 꼭 맞는 사람을 만나는 것에서 시작합니다." />
        <div className="grid gap-5 md:grid-cols-3">
          {STRENGTHS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-2xl">{s.icon}</div>
              <h3 className="mt-5 text-lg font-extrabold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 제공 서비스 */}
      <section className="mt-24">
        <SectionTitle eyebrow="WHAT WE DO" title="제공 서비스" desc="어르신의 건강 상태와 생활 습관에 맞춰 필요한 도움을 드립니다." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-2xl bg-slate-50 p-7">
              <div className="text-3xl">{s.icon}</div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-900">{s.title}</h3>
              <ul className="mt-4 space-y-2">
                {s.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600"><span className="text-teal-500">✓</span>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 이용 대상 */}
      <section className="mt-24">
        <SectionTitle eyebrow="WHO CAN USE" title="이용 대상" desc="장기요양등급이 없어도, 돌봄이 필요한 어르신이라면 누구나 이용하실 수 있습니다." />
        <div className="grid gap-5 md:grid-cols-3">
          {TARGETS.map((t) => (
            <div key={t.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-2xl">{t.icon}</div>
              <div>
                <h3 className="font-extrabold text-slate-900">{t.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-6 py-5 text-sm leading-6 text-amber-800">
          <b>💡 장기요양등급을 받아 두시면 좋아요.</b> 등급은 국민건강보험공단(1577-1000)에 신청할 수 있습니다.
        </div>
      </section>
    </SitePage>
  );
}
