/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6B46C1",
        secondary: "#10B981",
        bg: "#F3F4F6",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        white: "#FFFFFF",
        error: "#EF4444",
        purple2: "#8B5CF6",
      },
      animation: {
        "pulse-soft": "pulse-soft 2s infinite",
        shimmer: "shimmer 1.8s linear infinite",
        "ekg-sweep": "ekg-sweep 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(107,70,193,0)",
          },
          "50%": {
            transform: "scale(1.06)",
            boxShadow: "0 0 10px rgba(107,70,193,0.5)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200%" },
          "100%": { backgroundPosition: "200%" },
        },
        "ekg-sweep": {
          "0%": { maskPosition: "0%" },
          "100%": { maskPosition: "100%" },
        },
      },
      boxShadow: {
        purple: "0 0 10px rgba(107,70,193,0.5)",
      },
    },
  },
  plugins: [],
};
