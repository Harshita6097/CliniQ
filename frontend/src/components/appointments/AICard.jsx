export default function AICard({ type = 'pre', summary, portal = 'patient' }) {
  if (!summary) return null;

  const isPost = type === 'post';
  const label = isPost ? 'AI POST-VISIT SUMMARY' : 'AI PRE-VISIT SUMMARY';

  const URGENCY_STYLE = {
    High:   'bg-danger-tint text-[#7a2e29] border-danger/30',
    Medium: 'bg-warn-tint text-doctor-dark border-warn/30',
    Low:    'bg-ok-tint text-[#3a5c38] border-ok/30',
  };

  return (
    <div className="bg-paper-dim rounded-lg border-2 border-dashed border-stone p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] font-bold text-ink-soft uppercase tracking-widest">{label}</span>
        {summary.isFallback && (
          <span className="font-mono text-[10px] bg-warn-tint text-doctor-dark border border-warn/30 px-2 py-0.5 rounded-full">
            AI unavailable — showing standard template
          </span>
        )}
      </div>

      {!isPost && (
        <>
          {summary.urgency && URGENCY_STYLE[summary.urgency] && (
            <div className="mb-3">
              <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-3 py-1 rounded-full border ${URGENCY_STYLE[summary.urgency]}`}>
                <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                urgency: {summary.urgency.toLowerCase()}
              </span>
            </div>
          )}
          {summary.chiefComplaint && (
            <p className="text-sm text-ink mb-3">
              <span className="font-semibold">Chief complaint: </span>
              {summary.chiefComplaint}
            </p>
          )}
          {portal === 'patient' && summary.documentsToCarry?.length > 0 && (
            <div className="bg-white rounded-md p-4 border border-stone">
              <p className="font-mono text-[10px] font-bold text-ink-soft uppercase tracking-widest mb-3">What to bring</p>
              <ul className="space-y-2">
                {summary.documentsToCarry.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-ok shrink-0 mt-0.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {portal === 'doctor' && summary.suggestedQuestions?.length > 0 && (
            <div className="bg-white rounded-md p-4 border border-stone">
              <p className="font-mono text-[10px] font-bold text-ink-soft uppercase tracking-widest mb-3">Suggested questions</p>
              <ul className="space-y-2">
                {summary.suggestedQuestions.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink items-start">
                    <span className="font-mono text-[11px] text-ink-soft shrink-0 mt-0.5">{i + 1}.</span>
                    <span className="flex-1">{q}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(q); }}
                      title="Copy"
                      className="shrink-0 text-ink-soft hover:text-ink transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {isPost && summary.patientFriendlySummary && (
        <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
          {summary.patientFriendlySummary}
        </p>
      )}
    </div>
  );
}
