/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f141a',
        panel: '#151b23',
        accent: '#57d6ff',
        muted: '#96a3ad',
        border: '#1f2a36',
        chip: '#0f1f2c',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
