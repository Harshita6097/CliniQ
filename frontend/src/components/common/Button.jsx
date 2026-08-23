const PORTAL_COLORS = {
  patient: { primary: 'bg-patient hover:bg-patient-dark text-white focus-visible:ring-patient', ghost: 'bg-white/15 border border-white/40 text-white hover:bg-white/25' },
  doctor:  { primary: 'bg-doctor  hover:bg-doctor-dark  text-white focus-visible:ring-doctor',  ghost: 'bg-white/15 border border-white/40 text-white hover:bg-white/25' },
  admin:   { primary: 'bg-admin   hover:bg-admin-dark   text-white focus-visible:ring-admin',   ghost: 'bg-white/15 border border-white/40 text-white hover:bg-white/25' },
};

export default function Button({
  children,
  variant = 'primary',
  portal = 'patient',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm px-5 py-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  let colorClass = '';
  if (variant === 'destructive') {
    colorClass = 'bg-danger hover:bg-danger/90 text-white focus-visible:ring-danger';
  } else if (variant === 'ghost') {
    colorClass = PORTAL_COLORS[portal]?.ghost ?? PORTAL_COLORS.patient.ghost;
  } else {
    colorClass = PORTAL_COLORS[portal]?.primary ?? PORTAL_COLORS.patient.primary;
  }

  const hoverLift = !disabled && variant !== 'ghost' ? 'hover:-translate-y-0.5 hover:shadow-pop' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${colorClass} ${hoverLift} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
