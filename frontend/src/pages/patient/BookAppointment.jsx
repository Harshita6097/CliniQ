import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDoctors, holdAppointment, confirmAppointment, cancelAppointment } from '../../api/appointment.api';
import useSlots from '../../hooks/useSlots';
import { formatSlot } from '../../utils/dateUtils';
import toast from 'react-hot-toast';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { StepIndicator, Spinner } from '../../components/common/index.jsx';

const STEPS = ['Choose Doctor', 'Pick Slot', 'Symptoms'];

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ selected, onSelect, minDate }) {
  const [viewMonth, setViewMonth] = useState(selected ? new Date(selected) : new Date());
  const monthStart = startOfMonth(viewMonth);
  const monthEnd   = endOfMonth(viewMonth);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });
  const today      = startOfDay(new Date());
  const min        = minDate ? startOfDay(new Date(minDate)) : today;

  return (
    <div className="bg-white rounded-lg border border-stone shadow-soft p-4 w-full max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth(m => subMonths(m, 1))} className="p-1.5 rounded-md hover:bg-paper-dim text-ink-soft hover:text-ink transition-colors">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <p className="font-display text-sm font-semibold text-ink">{format(viewMonth, 'MMMM yyyy')}</p>
        <button onClick={() => setViewMonth(m => addMonths(m, 1))} className="p-1.5 rounded-md hover:bg-paper-dim text-ink-soft hover:text-ink transition-colors">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} className="text-center font-mono text-[10px] text-stone-dark py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(day => {
          const disabled = isBefore(day, min);
          const isSelected = selected && isSameDay(day, new Date(selected));
          const isCurrentMonth = isSameMonth(day, viewMonth);
          return (
            <button
              key={day.toISOString()}
              onClick={() => !disabled && onSelect(format(day, 'yyyy-MM-dd'))}
              disabled={disabled}
              className={`h-8 w-full rounded-md font-mono text-xs transition-colors ${
                isSelected ? 'bg-patient text-white font-bold'
                : isToday(day) && !isSelected ? 'bg-patient-tint text-patient-dark font-semibold'
                : disabled ? 'text-stone-dark cursor-not-allowed'
                : !isCurrentMonth ? 'text-stone-dark'
                : 'text-ink hover:bg-paper-dim'
              }`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function StepPickDoctor({ onSelect }) {
  const [search, setSearch] = useState('');
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors', search],
    queryFn: () => getDoctors(search),
    staleTime: 60_000,
  });

  return (
    <div className="animate-fadeIn">
      <h2 className="font-display text-lg font-semibold text-ink mb-1">Find a Doctor</h2>
      <p className="text-sm text-ink-soft mb-5">Search by specialization or browse all available doctors</p>
      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-dark" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text" placeholder="Search by specialization…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-md border border-stone pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-patient bg-paper focus:bg-white transition-colors text-ink"
        />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Spinner className="w-8 h-8 text-patient" /></div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12">
          <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-stone-dark mx-auto mb-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <p className="text-sm text-ink-soft">No doctors found for "{search}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {doctors.map(d => (
            <button
              key={d._id} onClick={() => onSelect(d)}
              className="flex items-center gap-4 bg-white border border-stone rounded-lg px-5 py-4 text-left hover:border-patient hover:shadow-pop hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-md bg-patient-tint flex items-center justify-center text-patient-dark font-display font-bold text-lg shrink-0">
                {d.userId?.name?.[0] ?? 'D'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{d.userId?.name}</p>
                <p className="font-mono text-xs text-patient mt-0.5">{d.specialization}</p>
                {d.slotDurationMins && <p className="text-xs text-ink-soft mt-0.5">{d.slotDurationMins} min slots</p>}
              </div>
              {d.consultationFee > 0 && (
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold text-ok">₹{d.consultationFee}</p>
                  <p className="text-xs text-ink-soft">fee</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function StepPickSlot({ doctor, onHeld, onBack }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]       = useState(today);
  const [loading, setLoading] = useState(false);
  const { data: slots = [], isLoading, isFetching } = useSlots(doctor.userId?._id, date);

  const handleSelect = async slot => {
    setLoading(true);
    try {
      const result = await holdAppointment({ doctorId: doctor.userId?._id, slotStart: slot.slotStart, slotEnd: slot.slotEnd });
      onHeld(result.appointment);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not hold slot.');
    } finally { setLoading(false); }
  };

  // Group slots by time of day
  const grouped = { Morning: [], Afternoon: [], Evening: [] };
  slots.forEach(slot => {
    const h = new Date(slot.slotStart).getHours();
    if (h < 12) grouped.Morning.push(slot);
    else if (h < 17) grouped.Afternoon.push(slot);
    else grouped.Evening.push(slot);
  });

  return (
    <div className="animate-fadeIn">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-patient hover:text-patient-dark font-semibold mb-5">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>
      <div className="flex items-center gap-4 mb-6 p-4 bg-patient-tint rounded-md border border-patient/20">
        <div className="w-12 h-12 rounded-md bg-patient flex items-center justify-center text-white font-display font-bold text-lg shadow-soft">
          {doctor.userId?.name?.[0] ?? 'D'}
        </div>
        <div>
          <p className="text-sm font-bold text-ink">{doctor.userId?.name}</p>
          <p className="font-mono text-xs text-patient">{doctor.specialization}</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-ink mb-3">Select date</label>
        <MiniCalendar selected={date} onSelect={setDate} minDate={today} />
      </div>

      {isLoading || isFetching ? (
        <div className="flex items-center justify-center py-12"><Spinner className="w-8 h-8 text-patient" /></div>
      ) : slots.length === 0 ? (
        <div className="text-center py-10 bg-paper-dim rounded-md border border-stone">
          <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-stone-dark mx-auto mb-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <p className="text-sm text-ink-soft font-semibold">No available slots for this date</p>
          <p className="text-xs text-stone-dark mt-1">Try selecting a different date</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([period, periodSlots]) => periodSlots.length > 0 && (
            <div key={period}>
              <p className="font-mono text-[10px] font-bold text-ink-soft uppercase tracking-widest mb-2">{period}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {periodSlots.map(slot => (
                  <button
                    key={slot.slotStart}
                    onClick={() => handleSelect(slot)}
                    disabled={loading}
                    className="rounded-md border border-stone bg-white hover:border-patient hover:bg-patient-tint hover:shadow-soft hover:-translate-y-0.5 font-mono text-xs font-semibold text-ink hover:text-patient-dark py-2.5 px-2 transition-all duration-150 disabled:opacity-50"
                  >
                    {format(new Date(slot.slotStart), 'hh:mm a')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
function HoldCountdown({ holdExpiresAt }) {
  const [secs, setSecs] = useState(() => Math.max(0, Math.floor((new Date(holdExpiresAt) - Date.now()) / 1000)));
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs / 60), s = secs % 60;
  const urgent = secs < 60 && secs > 0;
  const expired = secs === 0;
  return (
    <span className={`font-mono text-sm font-bold ${expired ? 'text-danger' : urgent ? 'text-danger animate-pulse2' : 'text-warn'}`}>
      {expired ? 'Expired' : `${m}:${String(s).padStart(2, '0')}`}
    </span>
  );
}

function StepSymptomForm({ appointment, onBack }) {
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await confirmAppointment(appointment.id, text.trim());
      toast.success('Appointment confirmed!');
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Confirmation failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-fadeIn">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-patient hover:text-patient-dark font-semibold mb-5">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>

      <h2 className="font-display text-lg font-semibold text-ink mb-1">Describe your symptoms</h2>
      <p className="text-sm text-ink-soft mb-4">This helps your doctor prepare. Please write in English for best AI results.</p>

      {/* Hold timer */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 bg-paper-dim border border-stone rounded-md px-4 py-2">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-ink-soft" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          <span className="text-xs font-semibold text-ink-soft">Slot: <span className="font-mono">{formatSlot(appointment.slotStart)}</span></span>
        </div>
        <div className="flex items-center gap-2 bg-warn-tint border border-warn/30 rounded-md px-4 py-2">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-warn" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          <span className="text-xs font-semibold text-warn">Hold expires in: <HoldCountdown holdExpiresAt={appointment.holdExpiresAt} /></span>
        </div>
      </div>

      {/* Confirmation summary */}
      {text.trim().length > 0 && (
        <div className="mb-4 bg-patient-tint border border-patient/20 rounded-md px-4 py-3">
          <p className="font-mono text-[10px] font-bold text-patient-dark uppercase tracking-widest mb-1">Booking summary</p>
          <p className="text-xs text-ink-soft">{text.trim().slice(0, 80)}{text.trim().length > 80 ? '…' : ''}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={text} onChange={e => setText(e.target.value)} required rows={6} maxLength={2000}
            placeholder="Describe your symptoms, how long you've had them, any medications you're taking…"
            className="w-full rounded-md border border-stone px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-patient resize-none bg-paper focus:bg-white transition-colors leading-relaxed text-ink"
          />
          <span className={`absolute bottom-3 right-4 font-mono text-[11px] ${text.length > 1800 ? 'text-warn font-semibold' : text.length < 20 ? 'text-danger' : 'text-stone-dark'}`}>
            {text.length}/2000
          </span>
        </div>

        <div className="flex items-start gap-3 bg-patient-tint border border-patient/20 rounded-md px-4 py-3">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-patient shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
          <p className="text-xs text-patient-dark">Our AI will generate a pre-visit summary to help your doctor prepare. Be as detailed as possible.</p>
        </div>

        <button
          type="submit" disabled={loading || text.trim().length < 20}
          className="w-full rounded-xl bg-patient hover:bg-patient-dark disabled:opacity-60 text-white font-bold text-sm py-3 transition-all duration-150 hover:shadow-pop hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner className="w-4 h-4" /> Confirming…</> : 'Confirm Appointment ✓'}
        </button>
      </form>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BookAppointment() {
  const [step, setStep]             = useState(1);
  const [selectedDoctor, setDoctor] = useState(null);
  const [heldAppointment, setHeld]  = useState(null);

  return (
    <div className="space-y-2 animate-fadeIn">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Book an Appointment</h1>
        <p className="text-sm text-ink-soft mt-1">Follow the steps below to schedule your visit</p>
      </div>
      <div className="bg-white rounded-lg border border-stone shadow-soft p-8">
        <StepIndicator steps={STEPS} currentStep={step} portal="patient" />
        {step === 1 && <StepPickDoctor onSelect={d => { setDoctor(d); setStep(2); }} />}
        {step === 2 && selectedDoctor && (
          <StepPickSlot
            doctor={selectedDoctor}
            onHeld={appt => { setHeld(appt); setStep(3); }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && heldAppointment && (
          <StepSymptomForm
            appointment={heldAppointment}
            onBack={async () => {
              try { await cancelAppointment(heldAppointment.id, 'Patient went back to change slot'); } catch (_) {}
              setHeld(null); setStep(2);
            }}
          />
        )}
      </div>
    </div>
  );
}
