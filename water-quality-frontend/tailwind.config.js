/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1a2234',
          950: '#0d1526',
        }
      },
      keyframes: {
        pulse2: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        }
      },
      animation: {
        'pulse-slow': 'pulse2 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
