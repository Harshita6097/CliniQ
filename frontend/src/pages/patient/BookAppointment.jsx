import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDoctors, holdAppointment, confirmAppointment } from "../../api/appointment.api";
import useSlots from "../../hooks/useSlots";
import { formatSlot } from "../../utils/dateUtils";
import toast from "react-hot-toast";
import { format } from "date-fns";

const today = format(new Date(), "yyyy-MM-dd");

// ─── Step 1: Pick a doctor ────────────────────────────────────────────────────
function StepPickDoctor({ onSelect }) {
  const [search, setSearch] = useState("");
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors", search],
    queryFn:  () => getDoctors(search),
    staleTime: 60 * 1000,
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Select a Doctor</h2>
      <input
        type="text"
        placeholder="Search by specialization…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading doctors…</p>
      ) : doctors.length === 0 ? (
        <p className="text-sm text-gray-400">No doctors found.</p>
      ) : (
        <ul className="space-y-3">
          {doctors.map((d) => (
            <li
              key={d._id}
              onClick={() => onSelect(d)}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 cursor-pointer hover:border-blue-400 hover:shadow-sm transition"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{d.userId?.name}</p>
                <p className="text-xs text-gray-500">{d.specialization}</p>
              </div>
              {d.consultationFee > 0 && (
                <p className="text-sm font-semibold text-blue-600">₹{d.consultationFee}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Step 2: Pick date + slot ─────────────────────────────────────────────────
function StepPickSlot({ doctor, onHeld, onBack }) {
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
    <div>
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-4">← Back</button>
      <h2 className="text-lg font-semibold text-gray-700 mb-1">
        Dr. {doctor.userId?.name}
      </h2>
      <p className="text-xs text-gray-500 mb-5">{doctor.specialization}</p>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select date</label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading || isFetching ? (
        <p className="text-sm text-gray-400">Loading slots…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-gray-400">No available slots for this date.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.slotStart}
              onClick={() => handleSelect(slot)}
              disabled={loading}
              className="rounded-lg border border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 text-sm text-gray-700 py-2 px-3 transition disabled:opacity-50"
            >
              {format(new Date(slot.slotStart), "hh:mm a")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Symptom form ─────────────────────────────────────────────────────
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
      toast.success("Appointment confirmed!");
      navigate("/patient/appointments");
    } catch (err) {
      toast.error(err.response?.data?.message || "Confirmation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-4">← Back</button>
      <h2 className="text-lg font-semibold text-gray-700 mb-1">Describe your symptoms</h2>
      <p className="text-xs text-gray-500 mb-1">
        Slot: {formatSlot(appointment.slotStart)}
      </p>
      <p className="text-xs text-amber-600 mb-5">
        Hold expires at {formatSlot(appointment.holdExpiresAt)} — please submit before then.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={5}
          placeholder="Describe your symptoms, duration, and any relevant medical history…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2 transition-colors"
        >
          {loading ? "Confirming…" : "Confirm Appointment"}
        </button>
      </form>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BookAppointment() {
  const [step, setStep]               = useState(1);
  const [selectedDoctor, setDoctor]   = useState(null);
  const [heldAppointment, setHeld]    = useState(null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Book an Appointment</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-xs font-medium">
        {["Choose Doctor", "Pick Slot", "Symptoms"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === i + 1 ? "bg-blue-600 text-white" : step > i + 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {step > i + 1 ? "✓" : i + 1}
            </span>
            <span className={step === i + 1 ? "text-blue-600" : "text-gray-400"}>{label}</span>
            {i < 2 && <span className="text-gray-300">›</span>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {step === 1 && (
          <StepPickDoctor
            onSelect={(d) => { setDoctor(d); setStep(2); }}
          />
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
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
