export default function NoteForm({ notes, setNotes }) {
  const len = notes.length;
  const counterColor = len > 4500 ? 'text-warn font-semibold' : len < 20 ? 'text-danger' : 'text-stone-dark';

  return (
    <div>
      <label className="block text-sm font-semibold text-ink mb-2">
        Clinical Notes *{' '}
        <span className="text-xs font-normal text-ink-soft">(min 20 characters)</span>
      </label>
      <div className="relative">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          required
          rows={5}
          maxLength={5000}
          placeholder="Diagnosis, observations, follow-up instructions…"
          className="w-full rounded-md border border-stone px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-doctor resize-none bg-paper focus:bg-white text-ink placeholder:text-stone-dark"
        />
        <span className={`absolute bottom-3 right-4 font-mono text-[11px] ${counterColor}`}>
          {len}/5000
        </span>
      </div>
    </div>
  );
}
