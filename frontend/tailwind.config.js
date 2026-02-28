/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:       "#080d1a",
        surface:  "#0d1426",
        "surface-2": "#111c33",
        border:   "#1a2540",
        "border-2": "#243352",
        cyan:     { DEFAULT: "#06b6d4", hover: "#0891b2", dim: "#0e7490" },
        violet:   { DEFAULT: "#8b5cf6", dim: "#6d28d9" },
        emerald:  { DEFAULT: "#10b981", dim: "#059669" },
        amber:    { DEFAULT: "#f59e0b", dim: "#d97706" },
        red:      { DEFAULT: "#ef4444", dim: "#dc2626" },
        "text-1": "#f1f5f9",
        "text-2": "#94a3b8",
        "text-3": "#475569",
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body:    ["'Outfit'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "fade-up":     "fadeUp 0.5s ease forwards",
        "fade-in":     "fadeIn 0.3s ease forwards",
        "pulse-slow":  "pulse 3s ease-in-out infinite",
        "scan":        "scan 4s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      backgroundImage: {
        "dot-grid": "radial-gradient(circle, #1a2540 1px, transparent 1px)",
        "glow-cyan": "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(6,182,212,0.12) 0%, transparent 70%)",
        "glow-violet": "radial-gradient(ellipse 40% 30% at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 60%)",
      },
    },
  },
  plugins: [],
};