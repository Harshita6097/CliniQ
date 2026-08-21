import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetAllDoctors,
  adminCreateDoctor,
  adminDeactivateDoctor,
  adminMarkLeave,
} from "../../api/admin.api";
import { format } from "date-fns";
import toast from "react-hot-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const today = format(new Date(), "yyyy-MM-dd");

const emptyForm = () => ({
  name: "", email: "", password: "", phone: "",
  specialization: "", slotDurationMins: 30, consultationFee: 0,
  qualifications: "", bio: "",
  workingHours: [{ day: "Monday", start: "09:00", end: "17:00" }],
});

export default function ManageDoctors() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(emptyForm());
  const [leaveModal, setLeaveModal] = useState(null); // { doctorId, name }
  const [leaveDate, setLeaveDate]   = useState("");

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["adminDoctors"],
    queryFn:  adminGetAllDoctors,
  });

  const { mutate: createDoctor, isPending: creating } = useMutation({
    mutationFn: adminCreateDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDoctors"] });
      setShowCreate(false);
      setForm(emptyForm());
      toast.success("Doctor created.");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to create doctor."),
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: adminDeactivateDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDoctors"] });
      toast.success("Doctor deactivated.");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to deactivate."),
  });

  const { mutate: markLeave, isPending: savingLeave } = useMutation({
    mutationFn: ({ id, dates }) => adminMarkLeave(id, dates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminDoctors"] });
      setLeaveModal(null);
      setLeaveDate("");
      toast.success(`Leave saved. ${data.cancelledCount} appointment(s) cancelled.`);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save leave."),
  });

  // Working hours helpers
  const addWorkingHour = () =>
    setForm(f => ({ ...f, workingHours: [...f.workingHours, { day: "Monday", start: "09:00", end: "17:00" }] }));
  const removeWorkingHour = (i) =>
    setForm(f => ({ ...f, workingHours: f.workingHours.filter((_, idx) => idx !== i) }));
  const updateWorkingHour = (i, field, value) =>
    setForm(f => ({
      ...f,
      workingHours: f.workingHours.map((wh, idx) => idx === i ? { ...wh, [field]: value } : wh),
    }));

  const handleCreate = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      slotDurationMins: Number(form.slotDurationMins),
      consultationFee:  Number(form.consultationFee),
      qualifications:   form.qualifications || undefined,
      bio:              form.bio || undefined,
      phone:            form.phone || undefined,
    };
    createDoctor(payload);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Manage Doctors</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-5 py-2.5 transition-colors"
        >
          + Add Doctor
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : doctors.length === 0 ? (
        <p className="text-sm text-gray-400">No doctors yet.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {doctors.map((d) => (
            <div key={d._id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{d.userId?.name}</p>
                  {!d.userId?.isActive && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{d.specialization}</p>
                <p className="text-xs text-gray-400">{d.userId?.email}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setLeaveModal({ doctorId: d.userId?._id, name: d.userId?.name })}
                  className="text-xs text-purple-600 hover:underline"
                >
                  Mark Leave
                </button>
                {d.userId?.isActive && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Deactivate Dr. ${d.userId?.name}?`))
                        deactivate(d.userId?._id);
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create doctor modal */}
      {showCreate && (
        <Modal title="Add New Doctor" onClose={() => { setShowCreate(false); setForm(emptyForm()); }}>
          <form onSubmit={handleCreate} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name *"      name="name"           value={form.name}           onChange={setForm} required />
              <Field label="Email *"          name="email"          value={form.email}          onChange={setForm} type="email" required />
              <Field label="Password *"       name="password"       value={form.password}       onChange={setForm} type="password" required />
              <Field label="Phone"            name="phone"          value={form.phone}          onChange={setForm} />
              <Field label="Specialization *" name="specialization" value={form.specialization} onChange={setForm} required />
              <Field label="Slot Duration (mins) *" name="slotDurationMins" value={form.slotDurationMins} onChange={setForm} type="number" required />
              <Field label="Consultation Fee (₹)" name="consultationFee" value={form.consultationFee} onChange={setForm} type="number" />
              <Field label="Qualifications"   name="qualifications" value={form.qualifications} onChange={setForm} />
            </div>
            <Field label="Bio" name="bio" value={form.bio} onChange={setForm} />

            {/* Working hours */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Working Hours *</label>
                <button type="button" onClick={addWorkingHour} className="text-xs text-purple-600 hover:underline">
                  + Add row
                </button>
              </div>
              <div className="space-y-2">
                {form.workingHours.map((wh, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      value={wh.day}
                      onChange={(e) => updateWorkingHour(i, "day", e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {DAYS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <input type="time" value={wh.start} onChange={(e) => updateWorkingHour(i, "start", e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
                    <span className="text-gray-400 text-xs">to</span>
                    <input type="time" value={wh.end} onChange={(e) => updateWorkingHour(i, "end", e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
                    {form.workingHours.length > 1 && (
                      <button type="button" onClick={() => removeWorkingHour(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setForm(emptyForm()); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg transition-colors">
                {creating ? "Creating…" : "Create Doctor"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mark leave modal */}
      {leaveModal && (
        <Modal title={`Mark Leave — Dr. ${leaveModal.name}`} onClose={() => { setLeaveModal(null); setLeaveDate(""); }}>
          <p className="text-sm text-gray-500 mb-4">
            Confirmed appointments on this day will be cancelled and patients notified.
          </p>
          <div className="flex gap-2 mb-5">
            <input
              type="date"
              value={leaveDate}
              min={today}
              onChange={(e) => setLeaveDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setLeaveModal(null); setLeaveDate(""); }}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={() => markLeave({ id: leaveModal.doctorId, dates: [leaveDate] })}
              disabled={!leaveDate || savingLeave}
              className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {savingLeave ? "Saving…" : "Save Leave"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Reusable helpers ─────────────────────────────────────────────────────────
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, name, value, onChange, type = "text", required }) => (
  <div>
    <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(f => ({ ...f, [name]: e.target.value }))}
      required={required}
      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
    />
  </div>
);
