import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        sidebar: "var(--color-sidebar)",
        ink: "var(--color-ink)",
        "ink-2": "var(--color-ink-2)",
        accent: "var(--color-accent)",
        "accent-light": "var(--color-accent-light)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        risk: {
          "muito-baixo": "var(--risk-muito-baixo)",
          "muito-baixo-bg": "var(--risk-muito-baixo-bg)",
          baixo: "var(--risk-baixo)",
          "baixo-bg": "var(--risk-baixo-bg)",
          medio: "var(--risk-medio)",
          "medio-bg": "var(--risk-medio-bg)",
          alto: "var(--risk-alto)",
          "alto-bg": "var(--risk-alto-bg)",
          critico: "var(--risk-critico)",
          "critico-bg": "var(--risk-critico-bg)"
        }
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        "card-md": "0 4px 12px rgba(15, 23, 42, 0.08)",
        panel: "0 20px 45px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
