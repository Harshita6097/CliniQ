import { useState } from 'react';
import { Link } from 'react-router-dom';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

const TABS = [
  {
    key: 'patient',
    label: 'Patient',
    gradient: 'linear-gradient(135deg, #8B4A58 0%, #A85C6B 50%, #C08893 100%)',
    heading: 'Book, track, and understand your care.',
    bullets: ['Book an appointment in under a minute', 'AI pre-visit summary prepared for your doctor', 'Prescriptions explained in plain English'],
    cta: { label: 'Sign up as a patient →', to: '/register', disabled: false },
    snippet: (
      <div className="bg-white/10 border border-white/25 rounded-xl p-5">
        <p className="font-mono text-[10px] text-white/60 uppercase tracking-widest mb-2">Upcoming</p>
        <p className="text-sm font-semibold text-white">Dr. Kavya Menon</p>
        <p className="font-mono text-xs text-white/70 mt-0.5">Sat, 30 Aug · 10:30 AM</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="font-mono text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">confirmed</span>
          <span className="font-mono text-[10px] text-white/60">Cardiology</span>
        </div>
      </div>
    ),
  },
  {
    key: 'doctor',
    label: 'Doctor',
    gradient: 'linear-gradient(135deg, #96692A 0%, #B8863C 50%, #C79F58 100%)',
    heading: 'Walk into every visit already prepared.',
    bullets: ['Patient symptoms summarised before you arrive', 'One-flow notes and prescription form', 'Leave management with auto conflict resolution'],
    cta: { label: 'Added by your clinic admin', to: null, disabled: true },
    snippet: (
      <div className="bg-white/10 border border-white/25 rounded-xl p-5">
        <p className="font-mono text-[10px] text-white/60 uppercase tracking-widest mb-2">Today</p>
        <p className="text-sm font-semibold text-white">3 patients today</p>
        <p className="font-mono text-xs text-white/70 mt-0.5">11 upcoming this week</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {['Confirmed · 2', 'Completed · 1'].map(t => (
            <div key={t} className="bg-white/10 rounded-lg px-2.5 py-2 text-center">
              <p className="font-mono text-[10px] text-white/80">{t}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: 'admin',
    label: 'Admin',
    gradient: 'linear-gradient(135deg, #432941 0%, #5B3A56 50%, #734870 100%)',
    heading: 'Run the whole clinic from one dashboard.',
    bullets: ['Full appointment visibility across all doctors', 'Manage doctors, leave, and schedules', 'Notification delivery tracked end to end'],
    cta: { label: 'Added by your organization', to: null, disabled: true },
    snippet: (
      <div className="bg-white/10 border border-white/25 rounded-xl p-5">
        <p className="font-mono text-[10px] text-white/60 uppercase tracking-widest mb-2">Overview</p>
        <div className="space-y-1.5">
          {[['312', 'patients'], ['14', 'doctors'], ['1,204', 'emails sent']].map(([n, l]) => (
            <div key={l} className="flex items-center justify-between">
              <span className="font-mono text-xs text-white/70">{l}</span>
              <span className="font-mono text-sm font-bold text-white">{n}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function RoleTabsCard() {
  const [active, setActive] = useState('patient');
  const tab = TABS.find(t => t.key === active);

  return (
    <section id="for-you" className="py-20 max-w-6xl mx-auto px-5">
      {/* Heading */}
      <div className="text-center mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">One platform, three portals</p>
        <h2 className="font-display text-[28px] font-medium text-ink">See it from every seat in the clinic.</h2>
      </div>

      {/* Card */}
      <div className="max-w-[760px] mx-auto bg-white rounded-3xl border border-stone shadow-soft overflow-hidden">
        {/* Tab row */}
        <div className="flex border-b border-stone">
          {TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={active === t.key}
              onClick={() => setActive(t.key)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-patient ${
                active === t.key
                  ? 'bg-white text-ink border-ink'
                  : 'bg-paper-dim text-ink-soft border-transparent hover:text-ink hover:bg-paper'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div
          key={active}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 animate-fadeIn"
          style={{ background: tab.gradient }}
        >
          {/* Left */}
          <div className="text-white">
            <h3 className="font-display text-xl font-medium mb-4 leading-snug">{tab.heading}</h3>
            <ul className="space-y-2.5 mb-6">
              {tab.bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-white/90">
                  <CheckIcon />
                  {b}
                </li>
              ))}
            </ul>
            {tab.cta.disabled ? (
              <div className="inline-block bg-white/20 text-white/70 text-sm font-semibold px-5 py-2.5 rounded-xl cursor-default border border-white/20">
                {tab.cta.label}
              </div>
            ) : (
              <Link
                to={tab.cta.to}
                className="inline-block bg-white text-ink text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-paper-dim transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {tab.cta.label}
              </Link>
            )}
          </div>

          {/* Right — snippet */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-xs">
              {tab.snippet}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
