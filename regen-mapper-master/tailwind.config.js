/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep forest — dark surfaces: navbar, footer, hero overlays
        canopy: {
          DEFAULT: '#0F3D2E',
          light: '#164F3B',
        },
        // Primary brand/action color — buttons, links, focus states
        moss: {
          DEFAULT: '#1F6F4F',
          light: '#278A62',
          dark: '#175A40',
        },
        // Single accent, spent deliberately on standout numbers
        sprout: '#6FCF7A',
        // Warm near-black text (never pure black)
        bark: '#2B2622',
        // Warm off-white background (never stark white)
        mist: '#F6F5F0',
        // Soil-toned neutral for hairline dividers/borders
        clay: {
          DEFAULT: '#C9BBA0',
          light: '#E4DCC9',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      keyframes: {
        'hero-rise': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'hero-rise': 'hero-rise 0.7s ease-out both',
      },
    },
  },
  plugins: [],
};
