import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';

// ─── DoctorCard ───────────────────────────────────────────────────────────────
export function DoctorCard({ d, onEdit, onLeave, onDeactivate, onReactivate }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isActive = d.userId?.isActive;

  return (
    <>
      <div className="bg-white rounded-lg border border-stone shadow-soft p-5 hover:shadow-pop transition-all duration-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-md bg-admin-tint flex items-center justify-center text-admin-dark font-display font-bold text-lg shrink-0">
            {d.userId?.name?.[0] ?? 'D'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-ink">{d.userId?.name}</p>
              {!isActive && (
                <span className="font-mono text-[10px] bg-danger-tint text-danger px-2 py-0.5 rounded-full">inactive</span>
              )}
            </div>
            <p className="font-mono text-xs text-admin mt-0.5">{d.specialization}</p>
            <p className="text-xs text-ink-soft mt-0.5">{d.userId?.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {d.consultationFee > 0 && (
            <span className="font-mono text-[11px] bg-ok-tint text-ok border border-ok/20 px-2.5 py-0.5 rounded-full">₹{d.consultationFee}</span>
          )}
          <span className="font-mono text-[11px] bg-admin-tint text-admin-dark border border-admin/20 px-2.5 py-0.5 rounded-full">{d.slotDurationMins} min slots</span>
          {d.leaveDays?.length > 0 && (
            <span className="font-mono text-[11px] bg-warn-tint text-warn border border-warn/20 px-2.5 py-0.5 rounded-full">{d.leaveDays.length} leave day{d.leaveDays.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onEdit(d)} className="flex-1 text-xs font-semibold text-admin bg-admin-tint hover:bg-admin-tint2 border border-admin/20 px-3 py-2 rounded-md transition-colors">Edit</button>
          <button onClick={() => onLeave(d)} className="flex-1 text-xs font-semibold text-warn bg-warn-tint hover:bg-warn-tint2 border border-warn/20 px-3 py-2 rounded-md transition-colors">Mark Leave</button>
          {isActive ? (
            <button onClick={() => setConfirmOpen(true)} className="flex-1 text-xs font-semibold text-danger bg-danger-tint hover:bg-danger/20 border border-danger/20 px-3 py-2 rounded-md transition-colors">Deactivate</button>
          ) : (
            <button onClick={() => onReactivate(d.userId?._id)} className="flex-1 text-xs font-semibold text-ok bg-ok-tint hover:bg-ok/20 border border-ok/20 px-3 py-2 rounded-md transition-colors">Reactivate</button>
          )}
        </div>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Deactivate doctor?">
        <div className="mb-5 flex gap-3 items-start bg-danger-tint border border-danger/30 rounded-md px-4 py-3">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-danger shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-danger">Dr. {d.userId?.name} will no longer appear in patient searches and cannot log in.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setConfirmOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-ink-soft bg-paper-dim hover:bg-stone rounded-xl transition-colors">Cancel</button>
          <Button variant="destructive" onClick={() => { onDeactivate(d.userId?._id); setConfirmOpen(false); }} className="flex-1">Deactivate</Button>
        </div>
      </Modal>
    </>
  );
}

// ─── WorkingHoursEditor ───────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function WorkingHoursEditor({ rows, onAdd, onRemove, onUpdate }) {
  const usedDays = rows.map(r => r.day);
  const duplicates = usedDays.filter((d, i) => usedDays.indexOf(d) !== i);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-ink">Working Hours *</label>
        <button type="button" onClick={onAdd} className="text-xs font-semibold text-admin bg-admin-tint hover:bg-admin-tint2 px-3 py-1.5 rounded-md transition-colors">+ Add row</button>
      </div>
      {duplicates.length > 0 && (
        <p className="text-xs text-danger mb-2">Duplicate day: {[...new Set(duplicates)].join(', ')} — each day can only appear once.</p>
      )}
      <div className="space-y-2 border border-stone rounded-md p-3 bg-paper-dim">
        {rows.map((wh, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-center bg-white rounded-md p-2 border border-stone">
            <select value={wh.day} onChange={e => onUpdate(i, 'day', e.target.value)} className="rounded-md border border-stone px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-admin bg-white text-ink">
              {DAYS.map(d => <option key={d}>{d}</option>)}
            </select>
            <input type="time" value={wh.start} onChange={e => onUpdate(i, 'start', e.target.value)} className="rounded-md border border-stone px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-admin bg-white text-ink" />
            <span className="text-ink-soft text-xs font-medium">to</span>
            <input type="time" value={wh.end} onChange={e => onUpdate(i, 'end', e.target.value)} className="rounded-md border border-stone px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-admin bg-white text-ink" />
            {rows.length > 1 && (
              <button type="button" onClick={() => onRemove(i)} className="text-danger hover:text-danger/70 text-sm font-bold px-1">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
export function Field({ label, name, value, onChange, type = 'text', required, disabled, tooltip }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1">
        {label}
        {tooltip && <span className="ml-1 text-stone-dark" title={tooltip}>ⓘ</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(f => ({ ...f, [name]: e.target.value }))}
        required={required}
        disabled={disabled}
        className={`w-full rounded-md border border-stone px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin bg-paper text-ink transition-colors ${disabled ? 'opacity-50 cursor-not-allowed bg-stone/30' : 'focus:bg-white'}`}
      />
    </div>
  );
}

// ─── PasswordField ────────────────────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  return s; // 0-3
}

export function PasswordField({ label, name, value, onChange, required }) {
  const [show, setShow] = useState(false);
  const strength = getStrength(value);
  const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Strong'];
  const STRENGTH_COLOR = ['', 'bg-danger', 'bg-warn', 'bg-ok'];

  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(f => ({ ...f, [name]: e.target.value }))}
          required={required}
          className="w-full rounded-md border border-stone px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-admin bg-paper focus:bg-white text-ink transition-colors"
        />
        <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs font-medium select-none">
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {value && (
        <div className="mt-1.5">
          <div className="flex gap-1 mb-1">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? STRENGTH_COLOR[strength] : 'bg-stone'}`} />
            ))}
          </div>
          <p className="text-[10px] text-ink-soft">{STRENGTH_LABEL[strength]} · 6–72 characters</p>
        </div>
      )}
    </div>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────
export function DataTable({ columns, rows, pageSize = 10, mobileCardView = false, renderMobileCard, keyField = '_id' }) {
  const [page, setPage] = useState(1);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {/* Mobile card view */}
      {mobileCardView && (
        <div className="sm:hidden space-y-3 p-4">
          {paged.map((row, i) => renderMobileCard ? renderMobileCard(row, i) : (
            <div key={row[keyField] ?? i} className="bg-white rounded-md border border-stone p-4 text-sm">
              {columns.map(col => (
                <div key={col.key} className="flex justify-between py-1 border-b border-stone last:border-0">
                  <span className="text-xs text-ink-soft font-semibold">{col.label}</span>
                  <span className="text-xs text-ink">{col.render ? col.render(row) : row[col.key]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Desktop table */}
      <div className={mobileCardView ? 'hidden sm:block overflow-x-auto' : 'overflow-x-auto'}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-paper-dim border-b border-stone">
              {columns.map(col => (
                <th key={col.key} className="px-5 py-3.5 text-left font-mono text-[11px] text-ink-soft uppercase tracking-wide whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row[keyField] ?? i}
                className={`border-b border-stone/50 hover:bg-paper-dim transition-colors ${i % 2 === 1 ? 'bg-paper/50' : ''} ${row._onClick ? 'cursor-pointer' : ''}`}
                onClick={row._onClick}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-5 py-3.5 text-ink">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-stone">
          <p className="font-mono text-[11px] text-ink-soft">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone text-ink-soft hover:bg-paper-dim disabled:opacity-40 transition-colors"
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${p === page ? 'bg-admin text-white border-admin' : 'border-stone text-ink-soft hover:bg-paper-dim'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone text-ink-soft hover:bg-paper-dim disabled:opacity-40 transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
