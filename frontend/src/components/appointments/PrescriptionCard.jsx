export default function PrescriptionCard({ prescription }) {
  if (!prescription?.length) return null;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    const rows = prescription.map(item =>
      `<tr><td>${item.medicine}</td><td>${item.dosage}</td><td>${item.frequency}</td><td>${item.durationDays}d</td><td>${item.notes || '—'}</td></tr>`
    ).join('');
    win.document.write(`<html><head><title>Prescription</title><style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body><h2>Prescription</h2><table><thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="relative bg-white rounded-lg border border-stone shadow-soft overflow-visible">
      <div className="-mt-2.5 ml-5 inline-block -rotate-2 bg-doctor text-white font-mono text-[10.5px] font-bold px-3 py-1 rounded-md shadow-soft mb-3">
        ℞ Rx
      </div>
      <div className="px-5 pb-5 space-y-3">
        {prescription.map((item, i) => (
          <div key={i} className="bg-doctor-tint border border-doctor/20 rounded-md px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">{item.medicine}</p>
                <p className="font-mono text-xs text-doctor-dark mt-0.5">{item.dosage}</p>
              </div>
              <span className="font-mono text-[11px] bg-white border border-doctor/30 text-doctor-dark px-2 py-0.5 rounded-full shrink-0">
                {item.durationDays}d
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-1.5">{item.frequency}</p>
            {item.notes && <p className="text-xs text-ink-soft/70 mt-1 italic">{item.notes}</p>}
          </div>
        ))}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs font-semibold text-doctor hover:text-doctor-dark transition-colors mt-2"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" rx="1" />
          </svg>
          Print prescription
        </button>
      </div>
    </div>
  );
}
