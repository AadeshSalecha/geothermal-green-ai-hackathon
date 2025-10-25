/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colorblind-friendly palette
        'site-actual': '#22c55e',
        'site-predicted': '#ef4444',
        'site-false-positive': '#f97316',
        'site-missed': '#8b5cf6',
      },
    },
  },
  plugins: [],
}
