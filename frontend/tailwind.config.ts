import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "var(--color-page)",
        surface: "var(--color-surface)",
        "surface-alt": "var(--color-surface-alt)",
        elevated: "var(--color-elevated)",
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
        tertiary: "var(--color-text-tertiary)",
        muted: "var(--color-text-muted)",
        faint: "var(--color-text-faint)",
        dimmed: "var(--color-text-dimmed)",
        inverted: "var(--color-text-inverted)",
        "border-default": "var(--color-border-default)",
        "border-subtle": "var(--color-border-subtle)",
        "border-strong": "var(--color-border-strong)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-soft": "var(--color-accent-soft)",
        "accent-text": "var(--color-accent-text)",
        "accent-muted": "var(--color-accent-muted)",
        danger: "var(--color-danger)",
        "danger-hover": "var(--color-danger-hover)",
        "danger-soft": "var(--color-danger-soft)",
        "danger-text": "var(--color-danger-text)",
        "danger-border": "var(--color-danger-border)",
        "input-bg": "var(--color-input-bg)",
        "input-focus": "var(--color-input-focus)",
        overlay: "var(--color-overlay)",
        pressed: "var(--color-pressed)",
        "pressed-strong": "var(--color-pressed-strong)",
      },
    },
  },
  plugins: [],
};

export default config;
