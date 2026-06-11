/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Helvetica Now Var"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        body: ['"Helvetica Now Var"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        lab: {
          bg: '#F9F9FB',
          surface: '#FFFFFF',
          raised: '#F1F3F8', // hover / active surface tint
          border: '#E2E8F0',
          primary: '#3B82F6',
          accent: '#10B981',
          heading: '#0F172A',
          body: '#475569',
          muted: '#94A3B8',
        },
      },
      borderRadius: {
        'lab-card': '16px',
        'lab-btn': '10px', // was 6px — aligns with the rest of the radius system
      },
      boxShadow: {
        'lab-soft': '0 4px 20px rgba(0,0,0,0.05)', // kept for back-compat
        // Three-step elevation scale
        'lab-float': '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'lab-lift': '0 6px 16px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)',
        'lab-modal': '0 20px 56px rgba(15,23,42,0.20), 0 6px 16px rgba(15,23,42,0.10)',
      },
      fontSize: {
        'display': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.025em', fontWeight: '700' }],
        'title': ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.015em', fontWeight: '600' }],
      },
      transitionTimingFunction: {
        'lab': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
