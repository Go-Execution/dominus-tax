/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dominus: {
          black: '#0A0A0A',
          charcoal: '#121212',
          'charcoal-light': '#1A1A1A',
          'charcoal-lighter': '#1F1F1F',
          emerald: '#006B4F',
          'emerald-deep': '#004D3A',
          'emerald-bright': '#008F6B',
          gold: '#C9A227',
          'gold-light': '#E8D48B',
          'gold-deep': '#A67C00',
          'gold-bright': '#FFD700',
          'text-primary': '#F5F5F5',
          'text-secondary': '#B8A87A',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
        display: ['Cinzel', 'serif'],
        script: ['"Great Vibes"', 'cursive'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'fade-in': 'fade-in 1s ease-out forwards',
        'scale-in': 'scale-in 0.7s ease-out forwards',
        'shimmer': 'shimmer 4s linear infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #E8D48B 0%, #C9A227 50%, #A67C00 100%)',
        'emerald-gradient': 'linear-gradient(135deg, #008F6B 0%, #006B4F 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #C9A227 0%, #FFD700 50%, #C9A227 100%)',
      },
      boxShadow: {
        'gold-glow': '0 0 30px rgba(201, 162, 39, 0.25)',
        'gold-glow-lg': '0 0 50px rgba(201, 162, 39, 0.35)',
        'emerald-glow': '0 0 30px rgba(0, 107, 79, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
