/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1D4ED8', tint: '#EFF6FF' },
        surface: '#ffffff',
        page: '#f8fafc',
        border: '#e2e8f0',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
        textMuted: '#94a3b8',
        success: '#16a34a',
        warning: '#D97706',
        danger: '#DC2626',
      },
    },
  },
  plugins: [],
}

