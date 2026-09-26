/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        'ink-2': '#2A2824',
        muted: '#4A4540',
        subtle: '#5E5850',
        faint: '#736C62',
        canvas: '#F7F4EE',
        paper: '#FFFEFA',
        line: '#E8E2D6',
        brand: '#FFE34D',
        brandink: '#1A1500',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif KR"', 'Georgia', 'serif'],
      },
      lineHeight: {
        relaxed: '1.625',
        snug: '1.45',
      },
    },
  },
  plugins: [],
}
