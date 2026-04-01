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
        sans:    ["var(--font-pretendard)", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-pretendard)", "sans-serif"],
        mono:    ["var(--font-dm-mono)", "monospace"],
      },
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* ── LUON AI Brand Palettes ── */
        taupe: {
          50:  "#f5f0ec",
          100: "#e8ddd6",
          200: "#d4c0b3",
          300: "#bfa091",
          400: "#8a6e62",
          500: "#554940",
          600: "#433a33",
          700: "#312b27",
          800: "#1f1b18",
          900: "#0d0c0a",
        },
        sage: {
          50:  "#f0f3ee",
          100: "#d8e2d2",
          200: "#bbc9b3",
          300: "#9daf94",
          400: "#879a77",
          500: "#6e8060",
          600: "#55654a",
          700: "#3d4a35",
          800: "#253020",
          900: "#0e150b",
        },
      },
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
