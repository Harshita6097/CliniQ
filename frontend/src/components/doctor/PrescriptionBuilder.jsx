const FREQUENCIES = [
  'Once daily', 'Twice daily', 'Three times daily',
  'Four times daily', 'Every 8 hours', 'Every 12 hours', 'Weekly', 'As needed',
];

const emptyItem = () => ({ medicine: '', dosage: '', frequency: 'Once daily', durationDays: 1, notes: '' });

export default function PrescriptionBuilder({ prescription, setPrescription }) {
  const addItem    = () => setPrescription(p => [...p, emptyItem()]);
  const removeItem = (i) => setPrescription(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) =>
    setPrescription(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const inputCls = 'w-full rounded-md border border-stone px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doctor bg-white text-ink';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-ink">Prescription</label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-xs font-semibold text-doctor-dark bg-doctor-tint hover:bg-doctor-tint2 px-3 py-1.5 rounded-md transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 4v16m8-8H4" />
          </svg>
          Add medicine
        </button>
      </div>

      {prescription.length === 0 && (
        <div className="text-center py-6 bg-paper-dim rounded-md border border-dashed border-stone">
          <p className="text-xs text-ink-soft">No medicines added yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {prescription.map((item, i) => (
          <div key={i} className="border border-doctor/20 rounded-md p-4 bg-doctor-tint/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-doctor-dark bg-doctor-tint px-2.5 py-0.5 rounded-full">
                Medicine {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-xs font-semibold text-danger bg-danger-tint hover:bg-danger/20 px-2.5 py-1 rounded-md transition-colors"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-soft mb-1 block">Medicine *</label>
                <input value={item.medicine} onChange={e => updateItem(i, 'medicine', e.target.value)} required placeholder="e.g. Paracetamol" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-soft mb-1 block">Dosage *</label>
                <input value={item.dosage} onChange={e => updateItem(i, 'dosage', e.target.value)} required placeholder="e.g. 500mg" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-soft mb-1 block">Frequency *</label>
                <select value={item.frequency} onChange={e => updateItem(i, 'frequency', e.target.value)} className={inputCls}>
                  {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-soft mb-1 block">Duration (days) *</label>
                <input type="number" min={1} value={item.durationDays} onChange={e => updateItem(i, 'durationDays', Number(e.target.value))} required className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft mb-1 block">Notes (optional)</label>
              <input value={item.notes} onChange={e => updateItem(i, 'notes', e.target.value)} placeholder="e.g. Take after meals" className={inputCls} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
