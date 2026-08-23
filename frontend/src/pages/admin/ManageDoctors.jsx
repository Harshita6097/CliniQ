import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetAllDoctors, adminCreateDoctor, adminUpdateDoctor, adminDeactivateDoctor, adminReactivateDoctor, adminMarkLeave } from '../../api/admin.api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { SkeletonLoader, EmptyState } from '../../components/common/index.jsx';
import { DoctorCard, WorkingHoursEditor, Field, PasswordField } from '../../components/admin/index.jsx';

const emptyForm = () => ({
  name: '', email: '', password: '', phone: '',
  specialization: '', slotDurationMins: 30, consultationFee: 0,
  qualifications: '', bio: '',
  workingHours: [{ day: 'Monday', start: '09:00', end: '17:00' }],
});

export default function ManageDoctors() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch]         = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(emptyForm());
  const [editModal, setEditModal]   = useState(null);
  const [editForm, setEditForm]     = useState(null);
  const [leaveModal, setLeaveModal] = useState(null);
  const [leaveDate, setLeaveDate]   = useState('');
  const [leavePending, setLeavePending] = useState([]);

  const { data: doctors = [], isLoading } = useQuery({ queryKey: ['adminDoctors'], queryFn: adminGetAllDoctors });

  const { mutate: createDoctor, isPending: creating } = useMutation({
    mutationFn: adminCreateDoctor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminDoctors'] }); setShowCreate(false); setForm(emptyForm()); toast.success('Doctor created.'); },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create doctor.'),
  });
  const { mutate: updateDoctor, isPending: updating } = useMutation({
    mutationFn: ({ id, data }) => adminUpdateDoctor(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminDoctors'] }); setEditModal(null); setEditForm(null); toast.success('Doctor profile updated.'); },
    onError: err => toast.error(err.response?.data?.message || 'Failed to update doctor.'),
  });
  const { mutate: deactivate } = useMutation({
    mutationFn: adminDeactivateDoctor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminDoctors'] }); toast.success('Doctor deactivated.'); },
    onError: err => toast.error(err.response?.data?.message || 'Failed to deactivate.'),
  });
  const { mutate: reactivate } = useMutation({
    mutationFn: adminReactivateDoctor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminDoctors'] }); toast.success('Doctor reactivated.'); },
    onError: err => toast.error(err.response?.data?.message || 'Failed to reactivate.'),
  });
  const { mutate: saveLeave, isPending: savingLeave } = useMutation({
    mutationFn: ({ id, dates }) => adminMarkLeave(id, dates),
    onSuccess: data => { queryClient.invalidateQueries({ queryKey: ['adminDoctors'] }); setLeaveModal(null); setLeaveDate(''); setLeavePending([]); toast.success(`Leave saved. ${data.cancelledCount ?? 0} appointment(s) cancelled.`); },
    onError: err => toast.error(err.response?.data?.message || 'Failed to save leave.'),
  });

  const addWH    = () => setForm(f => ({ ...f, workingHours: [...f.workingHours, { day: 'Monday', start: '09:00', end: '17:00' }] }));
  const removeWH = i => setForm(f => ({ ...f, workingHours: f.workingHours.filter((_, idx) => idx !== i) }));
  const updateWH = (i, field, value) => setForm(f => ({ ...f, workingHours: f.workingHours.map((wh, idx) => idx === i ? { ...wh, [field]: value } : wh) }));
  const addEditWH    = () => setEditForm(f => ({ ...f, workingHours: [...f.workingHours, { day: 'Monday', start: '09:00', end: '17:00' }] }));
  const removeEditWH = i => setEditForm(f => ({ ...f, workingHours: f.workingHours.filter((_, idx) => idx !== i) }));
  const updateEditWH = (i, field, value) => setEditForm(f => ({ ...f, workingHours: f.workingHours.map((wh, idx) => idx === i ? { ...wh, [field]: value } : wh) }));

  const openEdit = d => {
    setEditForm({ specialization: d.specialization, slotDurationMins: d.slotDurationMins, consultationFee: d.consultationFee, qualifications: d.qualifications || '', bio: d.bio || '', workingHours: d.workingHours?.length ? d.workingHours : [{ day: 'Monday', start: '09:00', end: '17:00' }] });
    setEditModal({ doctorId: d.userId?._id, name: d.userId?.name });
  };

  const handleCreate = e => {
    e.preventDefault();
    createDoctor({ ...form, slotDurationMins: Number(form.slotDurationMins), consultationFee: Number(form.consultationFee), qualifications: form.qualifications || undefined, bio: form.bio || undefined, phone: form.phone || undefined });
  };
  const handleEdit = e => {
    e.preventDefault();
    updateDoctor({ id: editModal.doctorId, data: { ...editForm, slotDurationMins: Number(editForm.slotDurationMins), consultationFee: Number(editForm.consultationFee), qualifications: editForm.qualifications || undefined, bio: editForm.bio || undefined } });
  };

  const stageLeaveDate = () => {
    if (!leaveDate || leavePending.includes(leaveDate)) return;
    setLeavePending(p => [...p, leaveDate].sort());
    setLeaveDate('');
  };

  const filtered = doctors.filter(d => !search || d.userId?.name?.toLowerCase().includes(search.toLowerCase()) || d.specialization?.toLowerCase().includes(search.toLowerCase()));

  const inputCls = 'w-full rounded-md border border-stone px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin bg-paper focus:bg-white text-ink transition-colors';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Manage Doctors</h1>
          <p className="text-sm text-ink-soft mt-1">Add, edit, deactivate, and manage doctor schedules</p>
        </div>
        <Button portal="admin" onClick={() => setShowCreate(true)}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 4v16m8-8H4" /></svg>
          Add Doctor
        </Button>
      </div>

      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-dark" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        <input type="text" placeholder="Search doctors…" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-md border border-stone pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin bg-paper focus:bg-white text-ink" />
      </div>

      {isLoading ? <SkeletonLoader variant="card" count={4} /> : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone shadow-soft">
          <EmptyState icon={<svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} heading="No doctors yet" subtext='Click "Add Doctor" to get started' />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(d => (
            <DoctorCard key={d._id} d={d} onEdit={openEdit} onLeave={d => setLeaveModal({ doctorId: d.userId?._id, name: d.userId?.name })} onDeactivate={deactivate} onReactivate={reactivate} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setForm(emptyForm()); }} title="Add New Doctor" maxWidth="max-w-lg">
        <form onSubmit={handleCreate} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *"            name="name"             value={form.name}             onChange={setForm} required />
            <Field label="Email *"                name="email"            value={form.email}            onChange={setForm} type="email" required />
            <PasswordField label="Password *"     name="password"         value={form.password}         onChange={setForm} required />
            <Field label="Phone"                  name="phone"            value={form.phone}            onChange={setForm} />
            <Field label="Specialization *"       name="specialization"   value={form.specialization}   onChange={setForm} required />
            <Field label="Slot Duration (mins) *" name="slotDurationMins" value={form.slotDurationMins} onChange={setForm} type="number" required />
            <Field label="Consultation Fee (₹)"   name="consultationFee"  value={form.consultationFee}  onChange={setForm} type="number" />
            <Field label="Qualifications"         name="qualifications"   value={form.qualifications}   onChange={setForm} />
          </div>
          <Field label="Bio" name="bio" value={form.bio} onChange={setForm} />
          <WorkingHoursEditor rows={form.workingHours} onAdd={addWH} onRemove={removeWH} onUpdate={updateWH} />
          <div className="flex justify-end gap-3 pt-2 border-t border-stone">
            <button type="button" onClick={() => { setShowCreate(false); setForm(emptyForm()); }} className="px-4 py-2.5 text-sm font-semibold text-ink-soft bg-paper-dim hover:bg-stone rounded-xl transition-colors">Cancel</button>
            <Button type="submit" portal="admin" disabled={creating}>{creating ? 'Creating…' : 'Create Doctor'}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      {editModal && editForm && (
        <Modal isOpen={true} onClose={() => { setEditModal(null); setEditForm(null); }} title={`Edit — Dr. ${editModal.name}`} maxWidth="max-w-lg">
          <div className="mb-4 flex items-start gap-2 bg-paper-dim border border-stone rounded-md px-3 py-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-ink-soft shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
            <p className="text-xs text-ink-soft">Name and email cannot be changed after account creation.</p>
          </div>
          <form onSubmit={handleEdit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Specialization *"       name="specialization"   value={editForm.specialization}   onChange={setEditForm} required />
              <Field label="Slot Duration (mins) *" name="slotDurationMins" value={editForm.slotDurationMins} onChange={setEditForm} type="number" required />
              <Field label="Consultation Fee (₹)"   name="consultationFee"  value={editForm.consultationFee}  onChange={setEditForm} type="number" />
              <Field label="Qualifications"         name="qualifications"   value={editForm.qualifications}   onChange={setEditForm} />
            </div>
            <Field label="Bio" name="bio" value={editForm.bio} onChange={setEditForm} />
            <WorkingHoursEditor rows={editForm.workingHours} onAdd={addEditWH} onRemove={removeEditWH} onUpdate={updateEditWH} />
            <div className="flex justify-end gap-3 pt-2 border-t border-stone">
              <button type="button" onClick={() => { setEditModal(null); setEditForm(null); }} className="px-4 py-2.5 text-sm font-semibold text-ink-soft bg-paper-dim hover:bg-stone rounded-xl transition-colors">Cancel</button>
              <Button type="submit" portal="admin" disabled={updating}>{updating ? 'Saving…' : 'Save Changes'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Leave modal — multi-date */}
      {leaveModal && (
        <Modal isOpen={true} onClose={() => { setLeaveModal(null); setLeaveDate(''); setLeavePending([]); }} title={`Mark Leave — Dr. ${leaveModal.name}`}>
          <p className="text-sm text-ink-soft mb-4">Confirmed appointments on these days will be cancelled and patients notified.</p>
          <div className="flex gap-3 mb-4 flex-wrap">
            <input type="date" value={leaveDate} min={today} onChange={e => setLeaveDate(e.target.value)} className="rounded-md border border-stone px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-admin bg-paper text-ink" />
            <button onClick={stageLeaveDate} disabled={!leaveDate} className="rounded-md bg-admin-tint hover:bg-admin-tint2 disabled:opacity-50 text-admin-dark font-semibold text-sm px-4 py-2.5 transition-colors border border-admin/20">Stage</button>
          </div>
          {leavePending.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {leavePending.map(d => (
                <span key={d} className="flex items-center gap-1.5 bg-admin-tint border border-admin/20 text-admin-dark font-mono text-[11px] font-semibold px-3 py-1.5 rounded-full">
                  {format(parseISO(d), 'dd MMM yyyy')}
                  <button onClick={() => setLeavePending(p => p.filter(x => x !== d))} className="text-admin-dark/70 hover:text-admin-dark font-bold">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => { setLeaveModal(null); setLeaveDate(''); setLeavePending([]); }} className="px-4 py-2.5 text-sm font-semibold text-ink-soft bg-paper-dim hover:bg-stone rounded-xl transition-colors">Cancel</button>
            <Button portal="admin" onClick={() => saveLeave({ id: leaveModal.doctorId, dates: leavePending.length > 0 ? leavePending : leaveDate ? [leaveDate] : [] })} disabled={(!leaveDate && leavePending.length === 0) || savingLeave}>
              {savingLeave ? 'Saving…' : 'Save Leave'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
