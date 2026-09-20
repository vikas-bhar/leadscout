import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      fontSize: {
        body: ["14px", { lineHeight: "20px" }],
        label: ["12px", { lineHeight: "16px" }],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "#378ADD",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "#e5e7eb",
        success: {
          DEFAULT: "#16a34a",
          foreground: "#14532d",
          muted: "#dcfce7",
        },
        warning: {
          DEFAULT: "#d97706",
          foreground: "#78350f",
          muted: "#fef3c7",
        },
        danger: {
          DEFAULT: "#dc2626",
          foreground: "#7f1d1d",
          muted: "#fee2e2",
        },
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
