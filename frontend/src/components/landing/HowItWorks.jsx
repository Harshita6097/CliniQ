const STEPS = [
  {
    num: '01',
    title: 'Book & describe',
    body: 'Pick a slot, tell us what\'s going on.',
    color: '#A85C6B',
    border: 'border-patient',
    text: 'text-patient',
  },
  {
    num: '02',
    title: 'AI prepares',
    body: 'Summary generated, calendar synced.',
    color: '#B8863C',
    border: 'border-doctor',
    text: 'text-doctor',
  },
  {
    num: '03',
    title: 'Follow up',
    body: 'Plain-English notes & reminders.',
    color: '#5B3A56',
    border: 'border-admin',
    text: 'text-admin',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-paper-dim py-20">
      <div className="max-w-6xl mx-auto px-5">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">How it works</p>
          <h2 className="font-display text-[28px] font-medium text-ink">Three steps, start to finish.</h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line — desktop only */}
          <div className="hidden md:block absolute top-7 left-0 right-0 px-[16.67%]">
            <svg width="100%" height="4" viewBox="0 0 600 4" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#A85C6B" />
                  <stop offset="50%"  stopColor="#B8863C" />
                  <stop offset="100%" stopColor="#5B3A56" />
                </linearGradient>
              </defs>
              <line
                x1="0" y1="2" x2="600" y2="2"
                stroke="url(#lineGrad)"
                strokeWidth="2"
                strokeDasharray="2 8"
                opacity="0.7"
              />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full bg-white border-2 ${step.border} flex items-center justify-center mb-5 shadow-soft`}>
                  <span className={`font-mono font-bold text-sm ${step.text}`}>{step.num}</span>
                </div>
                <h3 className="font-semibold text-base text-ink mb-1.5">{step.title}</h3>
                <p className="text-ink-soft text-[13px] max-w-[180px]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
