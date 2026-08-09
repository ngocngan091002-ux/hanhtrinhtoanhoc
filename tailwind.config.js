/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        math: {
          blue: '#1E40AF',
          sky: '#0284C7',
          teal: '#0D9488',
          amber: '#D97706',
          emerald: '#059669',
          rose: '#E11D48',
          slate: '#0F172A',
          gold: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
