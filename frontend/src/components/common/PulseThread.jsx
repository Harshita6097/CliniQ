export default function PulseThread({ color = '#ffffff', opacity = 0.35, className = '' }) {
  return (
    <svg
      viewBox="0 0 900 300"
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M0 150 L110 150 L140 90 L175 200 L200 120 L225 150 L280 150 C 400 150, 380 90, 480 110 S 700 70, 900 120"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    </svg>
  );
}
