import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDoctors, holdAppointment, confirmAppointment, cancelAppointment } from "../../api/appointment.api";
import useSlots from "../../hooks/useSlots";
import { formatSlot } from "../../utils/dateUtils";
import toast from "react-hot-toast";
import { format } from "date-fns";

const STEPS = ["Choose Doctor", "Pick Slot", "Symptoms"];

function StepIndicator({ step }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const num    = i + 1;
        const active = step === num;
        const done   = step > num;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                done   ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" :
                active ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200 scale-110" :
                         "bg-gray-100 text-gray-400"
              }`}>
                {done ? "✓" : num}
              </div>
              <span className={`text-xs font-medium mt-1.5 ${active ? "text-teal-600" : done ? "text-emerald-500" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-0.5 mx-1 mb-5 rounded-full transition-all duration-300 ${done ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function StepPickDoctor({ onSelect }) {
  const [search, setSearch] = useState("");
  const { data: doctors = [], isLoading } = useQuery({
    queryKey:  ["doctors", search],
    queryFn:   () => getDoctors(search),
    staleTime: 60_000,
  });

  return (
    <div className="animate-fadeIn">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Find a Doctor</h2>
      <p className="text-sm text-gray-400 mb-5">Search by specialization or browse all available doctors</p>

      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by specialization…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-gray-500">No doctors found for "{search}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {doctors.map((d) => (
            <button
              key={d._id}
              onClick={() => onSelect(d)}
              className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-5 py-4 text-left hover:border-teal-300 hover:shadow-md hover:shadow-teal-100 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center text-teal-700 font-bold text-lg shadow-sm shrink-0">
                {d.userId?.name?.[0] ?? "D"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{d.userId?.name}</p>
                <p className="text-xs text-teal-600 font-medium mt-0.5">{d.specialization}</p>
                {d.slotDurationMins && (
                  <p className="text-xs text-gray-400 mt-0.5">⏱ {d.slotDurationMins} min slots</p>
                )}
              </div>
              {d.consultationFee > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-teal-600">₹{d.consultationFee}</p>
                  <p className="text-xs text-gray-400">fee</p>
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
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate]       = useState(today);
  const [loading, setLoading] = useState(false);
  const { data: slots = [], isLoading, isFetching } = useSlots(doctor.userId?._id, date);

  const handleSelect = async (slot) => {
    setLoading(true);
    try {
      const result = await holdAppointment({
        doctorId:  doctor.userId?._id,
        slotStart: slot.slotStart,
        slotEnd:   slot.slotEnd,
      });
      onHeld(result.appointment);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not hold slot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium mb-5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-100">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {doctor.userId?.name?.[0] ?? "D"}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{doctor.userId?.name}</p>
          <p className="text-xs text-teal-600 font-medium">{doctor.specialization}</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select date</label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
        />
      </div>

      {isLoading || isFetching ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-gray-500 font-medium">No available slots for this date</p>
          <p className="text-xs text-gray-400 mt-1">Try selecting a different date</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{slots.length} slots available</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.slotStart}
                onClick={() => handleSelect(slot)}
                disabled={loading}
                className="rounded-xl border border-gray-200 bg-white hover:border-teal-400 hover:bg-teal-50 hover:shadow-md hover:shadow-teal-100 hover:-translate-y-0.5 text-sm font-medium text-gray-700 hover:text-teal-700 py-2.5 px-2 transition-all duration-150 disabled:opacity-50"
              >
                {format(new Date(slot.slotStart), "hh:mm a")}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
function StepSymptomForm({ appointment, onBack }) {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await confirmAppointment(appointment.id, text.trim());
      toast.success("Appointment confirmed! 🎉");
      navigate("/patient/appointments");
    } catch (err) {
      toast.error(err.response?.data?.message || "Confirmation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium mb-5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h2 className="text-lg font-bold text-gray-800 mb-1">Describe your symptoms</h2>
      <p className="text-sm text-gray-400 mb-4">This helps your doctor prepare for your visit</p>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2">
          <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium text-teal-700">Slot: {formatSlot(appointment.slotStart)}</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs font-medium text-amber-700">Hold expires: {formatSlot(appointment.holdExpiresAt)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={6}
            maxLength={2000}
            placeholder="Describe your symptoms, how long you've had them, any medications you're taking, and relevant medical history…"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none bg-gray-50 focus:bg-white transition-colors leading-relaxed"
          />
          <span className={`absolute bottom-3 right-4 text-xs ${text.length > 1800 ? "text-amber-500 font-semibold" : "text-gray-300"}`}>{text.length}/2000</span>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-3">
          <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-600">Our AI will generate a pre-visit summary to help your doctor prepare. Be as detailed as possible.</p>
        </div>

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-60 text-white font-semibold text-sm py-3 transition-all duration-150 shadow-md shadow-teal-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          {loading ? "Confirming…" : "Confirm Appointment ✓"}
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
        <h1 className="text-2xl font-bold text-gray-800">Book an Appointment</h1>
        <p className="text-sm text-gray-400 mt-1">Follow the steps below to schedule your visit</p>
      </div>

      <div className="bg-white rounded-3xl shadow-md border border-teal-100 p-8">
        <StepIndicator step={step} />

        {step === 1 && (
          <StepPickDoctor onSelect={(d) => { setDoctor(d); setStep(2); }} />
        )}
        {step === 2 && selectedDoctor && (
          <StepPickSlot
            doctor={selectedDoctor}
            onHeld={(appt) => { setHeld(appt); setStep(3); }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && heldAppointment && (
          <StepSymptomForm
            appointment={heldAppointment}
            onBack={async () => {
              // Release the held slot so it becomes available again immediately
              try { await cancelAppointment(heldAppointment.id, "Patient went back to change slot"); } catch (_) {}
              setHeld(null);
              setStep(2);
            }}
          />
        )}
      </div>
    </div>
  );
}
