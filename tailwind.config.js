/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./**/*.html", "./*.js"],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: '#4d1616',
          dark: '#2A0C0C',
          light: '#7A2424'
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F5E2A1',
          dark: '#AA8C2C'
        },
        cream: '#fdf8f0'
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      animation: {
        'gradient-x': 'gradient-x 5s ease infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' }
        },
        'glow': {
          '0%': { 'box-shadow': '0 0 10px rgba(212, 175, 55, 0.2)' },
          '100%': { 'box-shadow': '0 0 20px rgba(212, 175, 55, 0.6)' }
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: [],
}
