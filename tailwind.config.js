/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        neon: {
          blue: '#00f2ff',
          purple: '#ff00ff',
          green: '#00ff9f',
          pink: '#ff0099',
          yellow: '#ffff00',
        },
      },
    },
  },
  plugins: [],
};