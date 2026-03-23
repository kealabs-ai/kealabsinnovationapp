/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#EA580C',
          bg:     '#020617',
          surface:'#0F172A',
          border: '#1E293B',
          muted:  '#334155',
          text:   '#94A3B8',
          light:  '#CBD5E1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
