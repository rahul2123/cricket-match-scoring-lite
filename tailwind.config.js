/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        cricket: {
          /* Light mode - Core */
          primary: '#0E4F3A',      /* Deep Green - header, primary buttons */
          secondary: '#1F2A37',    /* Dark Navy - tabs, active, run buttons */
          bg: '#F8FAF9',          /* Off-White - page background */
          card: '#FFFFFF',        /* White - panels */
          /* Scoring logic */
          score: '#111827',       /* Almost Black - runs, current score */
          wicket: '#B42318',      /* Muted Red - wickets only */
          extras: '#CA8A04',      /* Mustard - WD, NB, B, LB */
          target: '#475569',      /* Slate - required/target info */
          success: '#15803D',     /* Cricket Green - save, submit, done */
          /* Dark mode */
          'dark-bg': '#0B1220',
          'dark-card': '#111827',
          'dark-accent': '#22C55E',
          'dark-text': '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        score: '600',
        'score-bold': '700',
      },
    },
  },
  plugins: [],
}
