/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        canvas: '#F7F4EE',
        paper: '#FFFEFA',
        line: '#E8E2D6',
        brand: '#FFE34D',
        brandink: '#1A1500',
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif KR"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
