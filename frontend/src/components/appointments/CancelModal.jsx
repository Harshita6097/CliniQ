import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';

export default function CancelModal({ isOpen, onClose, onConfirm, isPending }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason || 'Cancelled by patient');
    setReason('');
  };

  const handleClose = () => { setReason(''); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cancel appointment?">
      <div className="mb-5 flex gap-3 items-start bg-danger-tint border border-danger/30 rounded-md px-4 py-3">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-danger shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-danger">This action cannot be undone</p>
          <p className="text-xs text-danger/80 mt-0.5">The slot will be released and both you and the doctor will be notified by email.</p>
        </div>
      </div>
      <div className="mb-5">
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">Reason <span className="font-normal">(optional)</span></label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Let us know why you're cancelling…"
          rows={3}
          className="w-full rounded-md border border-stone px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-patient bg-paper resize-none text-ink"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleClose}
          className="flex-1 px-4 py-2.5 text-sm font-semibold text-ink-soft bg-paper-dim hover:bg-stone rounded-xl transition-colors"
        >
          Keep it
        </button>
        <Button variant="destructive" onClick={handleConfirm} disabled={isPending} className="flex-1">
          {isPending ? 'Cancelling…' : 'Yes, cancel'}
        </Button>
      </div>
    </Modal>
  );
}
