/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'monospace'],
      },
      colors: {
        geist: {
          bg: 'var(--geist-bg)',
          card: 'var(--geist-card)',
          hover: 'var(--geist-hover)',
          border: 'var(--geist-border)',
          borderFocus: 'var(--geist-border-focus)',
          text: 'var(--geist-text)',
          secondary: 'var(--geist-secondary)',
          muted: 'var(--geist-muted)',
          accent: 'var(--geist-accent)',
        },
        vercel: {
          blue: '#0070F3',
          emerald: '#10B981',
          amber: '#F5A623',
          red: '#EE0000',
        }
      }
    },
  },
  plugins: [],
}
