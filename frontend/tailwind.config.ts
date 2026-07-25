import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        imperial: {
          black: "#0B0B0C",
          charcoal: "#211F1D",
          ivory: "#F7F4EE",
          gold: "#C9A24B",
          "gold-light": "#E4C87A",
          bronze: "#8A6A3F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.3em",
      },
      boxShadow: {
        gold: "0 8px 30px -12px rgba(201, 162, 75, 0.45)",
        elevated: "0 20px 50px -20px rgba(11, 11, 12, 0.35)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #E4C87A 0%, #C9A24B 45%, #8A6A3F 100%)",
        "charcoal-gradient": "linear-gradient(160deg, #211F1D 0%, #0B0B0C 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
