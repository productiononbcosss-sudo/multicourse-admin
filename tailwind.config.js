/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        success: '#059669',
        warning: '#D97706',
        danger: '#DC2626',
      }
    },
  },
  plugins: [],
}