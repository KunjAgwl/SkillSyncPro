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
        "primary": "#E2B96E", 
        "primary-soft": "#F2E6D0", 
        "background-light": "#F6F1E8", 
        "background-dark": "#1C1A16",
        "text-main": "#5C5850",
        "text-light": "#948F85",
        "surface-light": "#F6F1E8",
        "surface-dark": "#2A2723",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      },
      boxShadow: {
        'neu-flat': '9px 9px 18px #d1cdc5, -9px -9px 18px #ffffff',
        'neu-pressed': 'inset 6px 6px 12px #d1cdc5, inset -6px -6px 12px #ffffff',
        'neu-button': '6px 6px 12px #d1cdc5, -6px -6px 12px #ffffff',
        'neu-button-active': 'inset 4px 4px 8px #d1cdc5, inset -4px -4px 8px #ffffff',
        'neu-icon': '3px 3px 6px #d1cdc5, -3px -3px 6px #ffffff',
        
        // Dark mode shadows
        'neu-flat-dark': '9px 9px 18px #141210, -9px -9px 18px #24221c',
        'neu-pressed-dark': 'inset 6px 6px 12px #110f0d, inset -6px -6px 12px #272520',
        'neu-button-dark': '6px 6px 12px #100e0c, -6px -6px 12px #282620',
        'neu-button-active-dark': 'inset 4px 4px 8px #110f0d, inset -4px -4px 8px #272520',
      }
    },
  },
  plugins: [],
}
