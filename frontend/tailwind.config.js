// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "mind-primary":  "#6366f1",
        "mind-accent":   "#8b5cf6",
        "mind-soft":     "#e0e7ff",
        "mind-success":  "#34d399",
        "mind-warning":  "#fb923c",
        "mind-danger":   "#f87171",
      },
      borderRadius: {
        "xl":  "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      backdropBlur: {
        xs: "4px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
