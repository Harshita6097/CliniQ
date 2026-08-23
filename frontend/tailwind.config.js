/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper:       '#FAF5EE',
        'paper-dim': '#F3ECE1',
        ink:         '#2A2330',
        'ink-soft':  '#5c5563',
        stone:       '#E7DCCF',
        'stone-dark':'#cdbba3',
        patient: { DEFAULT: '#A85C6B', dark: '#8B4A58', light: '#C08893', tint: '#F5E6E8', tint2: '#EFD9DC' },
        doctor:  { DEFAULT: '#B8863C', dark: '#96692A', light: '#C79F58', tint: '#F6ECD9', tint2: '#EEDCB7' },
        admin:   { DEFAULT: '#5B3A56', dark: '#432941', light: '#734870', tint: '#E9E0E8', tint2: '#D8C6D5' },
        ok:      { DEFAULT: '#5C7A5A', tint: '#E4EBDF' },
        warn:    { DEFAULT: '#B8863C', tint: '#F6ECD9' },
        danger:  { DEFAULT: '#A8433C', tint: '#F3DFDC' },
        sage:    { DEFAULT: '#7C9473', tint: '#E9EEE4' },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans:    ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '10px',
        md: '16px',
        lg: '26px',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' },     to: { opacity: 1, transform: 'scale(1)' } },
        pulse2:  { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
      animation: {
        fadeIn:  'fadeIn 0.25s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        pulse2:  'pulse2 1s ease-in-out infinite',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(42,35,48,0.05), 0 12px 32px -12px rgba(42,35,48,0.10)',
        pop:  '0 8px 24px -6px rgba(42,35,48,0.18)',
      },
      borderWidth: { 3: '3px' },
    },
  },
  plugins: [],
};
