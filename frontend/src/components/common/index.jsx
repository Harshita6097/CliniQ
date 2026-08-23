// Card
export function Card({ children, className = '', noPad = false }) {
  return (
    <div className={`bg-white rounded-lg border border-stone shadow-soft ${noPad ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
}

// Badge — generic
export function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

// Toggle — portal-aware
const TOGGLE_ON = {
  patient: 'bg-patient',
  doctor:  'bg-doctor',
  admin:   'bg-admin',
};

export function Toggle({ enabled, onChange, disabled = false, portal = 'patient' }) {
  const onColor = TOGGLE_ON[portal] ?? 'bg-patient';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${enabled ? onColor : 'bg-stone-dark'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// Spinner — button-level only
export function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// EmptyState
export function EmptyState({ icon, heading, subtext, ctaLabel, ctaHref, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="mb-4 text-stone-dark">{icon}</div>}
      <p className="font-display text-base font-semibold text-ink mb-1">{heading}</p>
      {subtext && <p className="text-sm text-ink-soft mb-4">{subtext}</p>}
      {ctaLabel && (ctaHref ? (
        <a href={ctaHref} className="text-sm font-semibold text-patient hover:underline">{ctaLabel} →</a>
      ) : (
        <button onClick={onCta} className="text-sm font-semibold text-patient hover:underline">{ctaLabel} →</button>
      ))}
    </div>
  );
}

// SkeletonLoader
export function SkeletonLoader({ variant = 'card', count = 1 }) {
  const items = Array.from({ length: count });
  if (variant === 'stat') return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-stone animate-pulse" />
      ))}
    </div>
  );
  if (variant === 'row') return (
    <div className="space-y-2">
      {items.map((_, i) => (
        <div key={i} className="h-14 rounded-md bg-stone animate-pulse" />
      ))}
    </div>
  );
  // card
  return (
    <div className="space-y-4">
      {items.map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-stone p-6 space-y-3 animate-pulse">
          <div className="h-4 bg-stone rounded w-1/3" />
          <div className="h-3 bg-stone rounded w-2/3" />
          <div className="h-3 bg-stone rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

// StatusBadge
import { statusClasses, statusLabel } from '../../utils/statusBadge';
export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full lowercase ${statusClasses(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

// StepIndicator — pulse-thread stepper
export function StepIndicator({ steps, currentStep, portal = 'patient' }) {
  const PORTAL_COLOR = { patient: '#A85C6B', doctor: '#B8863C', admin: '#5B3A56' };
  const color = PORTAL_COLOR[portal] ?? '#A85C6B';

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = currentStep > num;
        const active = currentStep === num;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 ${
                  done   ? 'border-transparent text-white'
                  : active ? 'border-transparent text-white scale-110 shadow-pop'
                  : 'border-stone bg-paper text-ink-soft'
                }`}
                style={done || active ? { backgroundColor: color } : {}}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : num}
              </div>
              <span className={`text-xs font-medium mt-1.5 ${active ? 'text-ink' : done ? 'text-ink-soft' : 'text-stone-dark'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-16 mx-1 mb-5 relative h-px">
                <div className="absolute inset-0 bg-stone rounded-full" />
                <div
                  className="absolute inset-0 rounded-full transition-all duration-500"
                  style={{ backgroundColor: color, width: done ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
