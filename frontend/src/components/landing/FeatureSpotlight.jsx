function CheckIcon({ color }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FeatureSpotlight({ eyebrow, eyebrowColor, heading, body, bullets, bulletColor, visual, reverse }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-14 items-center`}>
      {/* Text side */}
      <div className={reverse ? 'lg:order-2' : ''}>
        <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: eyebrowColor }}>
          {eyebrow}
        </p>
        <h3 className="font-display text-2xl lg:text-[26px] font-medium text-ink leading-snug mb-4">
          {heading}
        </h3>
        <p className="text-ink-soft text-[14.5px] leading-relaxed mb-5">
          {body}
        </p>
        <ul className="space-y-2.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-ink">
              <CheckIcon color={bulletColor} />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Visual side */}
      <div className={reverse ? 'lg:order-1' : ''}>
        <div className="bg-white border border-stone rounded-2xl shadow-soft p-5">
          {visual}
        </div>
      </div>
    </div>
  );
}

/* ── Patient visual ─────────────────────────────────────────── */
function PatientVisual() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-patient-dark to-patient rounded-xl p-4 text-white">
        <p className="text-xs font-bold">Dr. Kavya Menon</p>
        <p className="font-mono text-[11px] text-white/70 mt-0.5">Sat, 30 Aug · 10:30 AM</p>
      </div>
      <div className="border-2 border-dashed border-stone rounded-xl p-4 bg-paper-dim">
        <span className="font-mono text-[9px] font-bold text-ink uppercase tracking-widest bg-ink text-white px-2 py-0.5 rounded">
          AI Pre-visit Summary
        </span>
        <p className="text-xs text-ink-soft mt-2 leading-relaxed">
          Urgency: <span className="font-semibold text-doctor-dark">Medium</span> · Fever with headache for 3 days. Bring recent blood reports.
        </p>
      </div>
    </div>
  );
}

/* ── Doctor visual ──────────────────────────────────────────── */
function DoctorVisual() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[['Hydrocortisone 1%', 'Topical · 14d'], ['Cetirizine 10mg', 'Once daily · 7d']].map(([med, detail]) => (
          <div key={med} className="bg-doctor-tint border border-doctor/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-ink">{med}</p>
            <p className="font-mono text-[10px] text-ink-soft mt-0.5">{detail}</p>
          </div>
        ))}
      </div>
      {[['AK', 'Ananya Kumar', 'Dermatitis'], ['VP', 'Vikram Patel', 'Eczema follow-up']].map(([init, name, detail]) => (
        <div key={name} className="flex items-center gap-3 bg-paper-dim border border-stone rounded-lg px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-doctor-tint flex items-center justify-center text-doctor-dark font-bold text-[10px] shrink-0">
            {init}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-ink">{name}</p>
            <p className="font-mono text-[10px] text-ink-soft">{detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Admin visual ───────────────────────────────────────────── */
function AdminVisual() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[['312', 'PATIENTS'], ['14', 'DOCTORS'], ['1,204', 'SENT']].map(([n, l]) => (
          <div key={l} className="bg-admin-tint border border-admin/20 rounded-lg p-3 text-center">
            <p className="font-display text-lg font-bold text-admin">{n}</p>
            <p className="font-mono text-[9px] text-ink-soft">{l}</p>
          </div>
        ))}
      </div>
      {[
        { init: 'RV', name: 'Rahul Verma → Dr. Sharma', badge: 'confirmed', badgeStyle: 'bg-patient-tint text-patient-dark' },
        { init: 'AS', name: 'Ananya Singh → Dr. Mehta', badge: 'completed', badgeStyle: 'bg-sage-tint text-[#3a5c38]' },
      ].map(row => (
        <div key={row.name} className="flex items-center gap-3 bg-paper-dim border border-stone rounded-lg px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-admin-tint flex items-center justify-center text-admin font-bold text-[10px] shrink-0">
            {row.init}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-ink truncate">{row.name}</p>
          </div>
          <span className={`font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full ${row.badgeStyle}`}>
            {row.badge}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Exported section ───────────────────────────────────────── */
export default function FeatureSpotlights() {
  const spotlights = [
    {
      eyebrow: 'For Patients',
      eyebrowColor: '#8B4A58',
      heading: 'Know what to expect, before you walk in.',
      body: 'Describe your symptoms once. CliniQ turns them into a structured pre-visit summary your doctor sees immediately — urgency, key concerns, what to bring.',
      bullets: ['15-minute slot holds, never double-booked', 'Synced straight to Google Calendar'],
      bulletColor: '#A85C6B',
      visual: <PatientVisual />,
      reverse: false,
    },
    {
      eyebrow: 'For Doctors',
      eyebrowColor: '#96692A',
      heading: 'Walk into every visit already prepared.',
      body: 'Suggested questions, patient history, and a one-flow notes-and-prescription form — so your focus stays on the patient, not the paperwork.',
      bullets: ['Patient-friendly summaries, auto-written', 'Leave & schedule management built in'],
      bulletColor: '#B8863C',
      visual: <DoctorVisual />,
      reverse: true,
    },
    {
      eyebrow: 'For Admins',
      eyebrowColor: '#5B3A56',
      heading: 'Run the whole clinic without losing the thread.',
      body: 'Every doctor, every appointment, every notification — one dashboard, with an audit trail on every action so nothing gets lost between shifts.',
      bullets: ['Full visibility across every appointment', 'Notification delivery tracked end to end'],
      bulletColor: '#5B3A56',
      visual: <AdminVisual />,
      reverse: false,
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-5 py-20 space-y-24">
      {spotlights.map((s, i) => (
        <FeatureSpotlight key={i} {...s} />
      ))}
    </section>
  );
}
