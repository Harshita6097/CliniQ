/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        fadeIn:  "fadeIn 0.3s ease-out",
        scaleIn: "scaleIn 0.2s ease-out",
        spin:    "spin 0.8s linear infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        scaleIn: { from: { opacity: 0, transform: "scale(0.95)" },     to: { opacity: 1, transform: "scale(1)" } },
      },
      borderWidth: { 3: "3px" },
    },
  },
  plugins: [],
};
