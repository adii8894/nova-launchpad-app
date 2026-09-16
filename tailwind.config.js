/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      colors: {
        bg: "#07070c",
        glass: "rgba(255,255,255,0.05)",
        glassBorder: "rgba(255,255,255,0.10)",
        aurora1: "#7c3aed",
        aurora2: "#06b6d4",
        aurora3: "#ec4899",
        buy: "#22d3a5",
        sell: "#fb5c7c",
      },
      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [],
};
