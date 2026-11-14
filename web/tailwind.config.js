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
        // Astryx Design System Color Palette
        astryx: {
          // Backgrounds
          bg: {
            light: '#f1f1f1',
            dark: '#1b1b1b',
          },
          surface: {
            light: '#ffffff',
            dark: '#262626',
            card: '#222222',
            muted: '#1f1f1f',
          },
          // Text colors
          text: {
            primary: {
              light: '#000000',
              dark: '#ffffff',
            },
            secondary: {
              light: '#474747',
              dark: '#9e9e9e',
            },
            disabled: {
              light: '#919191',
              dark: '#525252',
            }
          },
          // Accent colors
          accent: {
            light: '#1b1b1b',
            dark: '#f1f1f1',
            orange: '#EB6E00',
            orangeHover: '#d66100',
            blue: '#0171E3',
            green: '#0B991F',
            purple: '#6B1EFD',
          }
        },
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#EB6E00',
          600: '#d66100',
          700: '#c2410c',
        }
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
