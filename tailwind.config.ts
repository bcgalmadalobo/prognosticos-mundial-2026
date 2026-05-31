import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          900: "#14532d",
        },
        // Design system dark theme
        pitch: {
          950: "#0d1117",
          900: "#111827",
          800: "#161b22",
          700: "#1c2333",
          600: "#21262d",
          500: "#30363d",
          400: "#484f58",
          300: "#6e7681",
          200: "#8b949e",
          100: "#c9d1d9",
          50:  "#f0f6fc",
        },
        gold: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        neon: {
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
        },
      },
      boxShadow: {
        card:  "0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)",
        glow:  "0 0 20px rgba(34,197,94,0.15)",
        gold:  "0 0 20px rgba(251,191,36,0.2)",
      },
      backgroundImage: {
        "pitch-gradient": "linear-gradient(135deg, #0d1117 0%, #111827 50%, #0d1117 100%)",
        "brand-gradient": "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
        "gold-gradient":  "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
