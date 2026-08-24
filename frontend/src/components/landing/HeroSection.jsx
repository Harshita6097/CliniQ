import { Link } from 'react-router-dom';

function BrowserMock() {
  return (
    <div className="relative">
      {/* Floating pills */}
      <div className="absolute -top-4 -right-4 z-10 bg-ink text-white rounded-full px-3.5 py-2 text-xs font-semibold shadow-pop flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
        AI summary in ~6s
      </div>
      <div className="absolute -bottom-4 -left-4 z-10 bg-doctor-dark text-white rounded-full px-3.5 py-2 text-xs font-semibold shadow-pop flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
        Never double-booked
      </div>

      {/* Browser frame */}
      <div className="bg-white rounded-2xl shadow-pop overflow-hidden border border-white/20">
        {/* Browser top bar */}
        <div className="bg-paper-dim border-b border-stone px-3.5 py-2.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-stone-dark" />
          <span className="w-2 h-2 rounded-full bg-stone-dark" />
          <span className="w-2 h-2 rounded-full bg-stone-dark" />
        </div>

        {/* Mock content */}
        <div className="bg-paper p-4 space-y-3">
          {/* Mini hero strip */}
          <div className="bg-gradient-to-r from-patient to-patient-light rounded-xl p-4 text-white">
            <p className="text-xs font-bold">Good morning, Harshita.</p>
            <p className="text-[11px] text-white/70 mt-0.5">1 upcoming visit this week</p>
          </div>

          {/* Stat boxes */}
          <div className="grid grid-cols-3 gap-2">
            {[['1', 'UPCOMING'], ['6', 'COMPLETED'], ['8', 'TOTAL']].map(([n, l]) => (
              <div key={l} className="bg-white border border-stone rounded-lg p-2.5 text-center">
                <p className="font-display text-lg font-bold text-ink">{n}</p>
                <p className="font-mono text-[9px] text-ink-soft">{l}</p>
              </div>
            ))}
          </div>

          {/* Appointment rows */}
          {[
            { initials: 'PS', name: 'Dr. Priya Sharma', detail: 'Sat, 30 Aug · 10:30 AM', badge: 'confirmed', badgeStyle: 'bg-patient-tint text-patient-dark' },
            { initials: 'MN', name: 'Dr. Meera Nair', detail: 'Mon, 18 Aug · 2:00 PM', badge: 'completed', badgeStyle: 'bg-sage-tint text-[#3a5c38]' },
          ].map(row => (
            <div key={row.name} className="flex items-center gap-3 bg-white border border-stone rounded-lg px-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-patient-tint flex items-center justify-center text-patient-dark font-bold text-[10px] shrink-0">
                {row.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-2 bg-stone rounded-full w-24 mb-1.5" />
                <div className="h-1.5 bg-stone/60 rounded-full w-16" />
              </div>
              <span className={`font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full ${row.badgeStyle}`}>
                {row.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(120deg, #8B4A58 0%, #A85C6B 30%, #B8863C 68%, #96692A 88%, #5B3A56 115%)',
      }}
    >
      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Pulse SVG line */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 900 600"
        fill="none"
        style={{ opacity: 0.3 }}
      >
        <path
          d="M0 300 L90 300 L115 250 L150 340 L175 280 L200 300 L260 300 C400 300 380 230 500 260 S750 200 900 250"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <div className="relative max-w-6xl mx-auto px-5 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — text */}
        <div>
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-white/30 max-w-[40px]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-patient-tint2">
              Healthcare Appointment &amp; Follow-up Manager
            </span>
            <div className="h-px flex-1 bg-white/30 max-w-[40px]" />
          </div>

          <h1 className="font-display text-4xl lg:text-5xl font-medium leading-tight text-white mb-5">
            Your health,{' '}
            <em className="not-italic text-[#F6E4C9] italic">followed through.</em>
          </h1>

          <p className="text-patient-tint text-[15.5px] max-w-md mb-8 leading-relaxed">
            AI-prepared visit summaries, automatic calendar sync, and care that continues after the appointment ends.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-ink font-bold text-sm px-5 py-3 rounded-xl hover:bg-patient-tint transition-colors shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Create your account →
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-white/15 border border-white/40 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Right — browser mock */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-sm">
            <BrowserMock />
          </div>
        </div>
      </div>
    </section>
  );
}
