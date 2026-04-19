import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        nocturne: "var(--color-nocturne)",
        oxblood: "var(--color-oxblood)",
        gold: "var(--color-gold)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
      },
      fontFamily: {
        body: ["var(--font-body)"],
        heading: ["var(--font-heading)"],
        mono: ["var(--font-mono)"],
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        24: "var(--space-24)",
      },
      borderRadius: {
        soft: "var(--radius-soft)",
        panel: "var(--radius-panel)",
      },
      boxShadow: {
        float: "var(--shadow-float)",
      },
      transitionTimingFunction: {
        ritual: "var(--ease-ritual)",
      },
      transitionDuration: {
        160: "160ms",
        240: "240ms",
      },
      maxWidth: {
        shell: "72rem",
        reading: "48rem",
      },
    },
  },
  plugins: [],
};

export default config;
