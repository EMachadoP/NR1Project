import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        ink: "var(--color-ink)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        muted: "var(--color-muted)",
        line: "var(--color-line)"
      },
      boxShadow: {
        panel: "0 20px 45px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl2: "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
