/** Disco — light canvas, the logo's blue→violet gradient as the brand accent. */
import typography from "@tailwindcss/typography";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        canvas: {
          DEFAULT: "#F7F8FC", // soft white page
          panel: "#FFFFFF",
          inset: "#F1F2F8",
          rule: "#E6E8F0",
          ruleStrong: "#D3D7E3",
        },
        ink: {
          DEFAULT: "#14162A", // near-black navy (text on light)
          dim: "#4A4F66",
          mute: "#7A8095",
          faint: "#AEB3C4",
        },
        brand: {
          sky: "#3B95F5",
          violet: "#7C4DFF",
          mid: "#6E7BFF",
          glow: "rgba(110, 123, 255, 0.28)",
          tint: "#EEF1FF",
        },
        signal: {
          ok: "#1F9D57",
          warn: "#C7891F",
          err: "#D8453A",
          idle: "#AEB3C4",
        },
      },
      letterSpacing: {
        eyebrow: "0.22em",
      },
      backgroundImage: {
        brand: "linear-gradient(120deg, #46A5FF 0%, #6E7BFF 45%, #8A5CFF 100%)",
        "brand-soft": "linear-gradient(120deg, rgba(70,165,255,0.16), rgba(138,92,255,0.16))",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(20,22,40,0.06), 0 0 0 1px #E6E8F0",
        glow: "0 0 0 1px #D3D7E3, 0 18px 50px -20px rgba(110,123,255,0.45)",
        elev: "0 24px 60px -28px rgba(20,22,40,0.18), 0 0 0 1px #E6E8F0",
      },
      animation: {
        "caret-blink": "caret-blink 1.1s steps(2, end) infinite",
        "fade-up": "fade-up 320ms cubic-bezier(0.2,0.7,0.2,1) both",
        "glow-pulse": "glow-pulse 6s ease-in-out infinite",
      },
      keyframes: {
        "caret-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.06)" },
        },
      },
    },
  },
  plugins: [typography],
};
