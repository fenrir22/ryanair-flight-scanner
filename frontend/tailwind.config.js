/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        ryanair: {
          blue: '#073590',
          yellow: '#ffb71b',
          dark: '#0c1f3d',
          light: '#ffd966'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #073590 0%, #0c1f3d 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 183, 27, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 183, 27, 0.4)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 48px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
