/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f5f8',
          100: '#e9e7ef',
          200: '#d4d0e0',
          300: '#b3abc9',
          400: '#8d81ab',
          500: '#6f6191',
          600: '#5a4d78',
          700: '#4a4062',
          800: '#332c45',
          900: '#211c2e',
          950: '#17141f',
        },
        rose: {
          500: '#e11d78',
          600: '#c81368',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
