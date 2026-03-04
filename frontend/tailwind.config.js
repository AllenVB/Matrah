/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#137fec',
          50: '#eef7ff',
          100: '#d9ecff',
          200: '#bce0ff',
          300: '#8eceff',
          400: '#59b3ff',
          500: '#137fec',
          600: '#0b6dd4',
          700: '#0a57ab',
          800: '#0d498d',
          900: '#113f74',
        },
        background: {
          light: '#f6f7f8',
          dark: '#101922',
        },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
