/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Fully Tokenized Semantic Color Palette
        theme: {
          page: 'var(--bg-page)',
          surface: 'var(--bg-surface)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
          subtle: 'var(--bg-subtle)',
          'subtle-hover': 'var(--bg-subtle-hover)',
          input: 'var(--bg-input)',
          modal: 'var(--bg-modal)',
          overlay: 'var(--bg-overlay)',

          'border-subtle': 'var(--border-subtle)',
          'border-muted': 'var(--border-muted)',
          'border-emphasized': 'var(--border-emphasized)',

          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
          'text-disabled': 'var(--text-disabled)',

          accent: {
            DEFAULT: 'var(--accent-primary)',
            hover: 'var(--accent-hover)',
            subtle: 'var(--accent-subtle)',
            border: 'var(--accent-border)',
            contrast: 'var(--accent-contrast)',
          },

          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
          info: 'var(--status-info)',
        },
      },
      fontFamily: {
        sans: ['Figtree', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'inner': '8px',
        'element': '12px',
        'container': '16px',
      },
      transitionTimingFunction: {
        'astryx': 'cubic-bezier(0.24, 1, 0.4, 1)',
      },
      transitionDuration: {
        'fast': '175ms',
        'medium': '410ms',
      }
    },
  },
  plugins: [],
}
