export default function PulseThread({ color = '#ffffff', opacity = 0.35, className = '', yOffset = 220 }) {
  const y = yOffset;
  const amp = 40; // amplitude of the pulse spikes
  return (
    <svg
      viewBox="0 0 900 300"
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <path
        d={`M0 ${y} L110 ${y} L140 ${y - amp * 1.5} L175 ${y + amp} L200 ${y - amp * 0.75} L225 ${y} L280 ${y} C 400 ${y}, 380 ${y - amp} 480 ${y - amp * 0.75} S 700 ${y - amp * 2} 900 ${y - amp}`}
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
