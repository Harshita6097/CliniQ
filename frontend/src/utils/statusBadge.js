const STATUS_CONFIG = {
  held:      { label: 'held',      classes: 'bg-warn-tint text-doctor-dark font-mono text-[11px]' },
  confirmed: { label: 'confirmed', classes: 'bg-patient-tint text-patient-dark font-mono text-[11px]' },
  completed: { label: 'completed', classes: 'bg-sage-tint text-[#3a5c38] font-mono text-[11px]' },
  cancelled: { label: 'cancelled', classes: 'bg-danger-tint text-[#7a2e29] font-mono text-[11px]' },
};

export const getStatusConfig = (status) =>
  STATUS_CONFIG[status] ?? { label: status, classes: 'bg-paper-dim text-ink-soft font-mono text-[11px]' };

export const statusClasses = (status) => getStatusConfig(status).classes;
export const statusLabel   = (status) => getStatusConfig(status).label;
