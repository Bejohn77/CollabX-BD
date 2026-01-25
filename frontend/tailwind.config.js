/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F8FF',  // Alice Blue - lightest
          100: '#E6F4FF',
          200: '#CCE9FF',
          300: '#B3DDFF',
          400: '#99D2FF',
          500: '#80C7FF',
          600: '#66BCFF',
          700: '#4DB0FF',
          800: '#33A5FF',
          900: '#1A9AFF',
        },
        secondary: {
          50: '#AFEEEE',  // Pale Turquoise
          100: '#9FEAEA',
          200: '#8FE6E6',
          300: '#7FE2E2',
          400: '#6FDEDE',
          500: '#5FDADA',
          600: '#4FD6D6',
          700: '#3FD2D2',
          800: '#2FCECE',
          900: '#1FCACA',
        },
        accent: {
          50: '#FFE4E1',  // Misty Rose
          100: '#FFD8D4',
          200: '#FFCCC7',
          300: '#FFC0BA',
          400: '#FFB4AD',
          500: '#FFA8A0',
          600: '#FF9C93',
          700: '#FF9086',
          800: '#FF8479',
          900: '#FF786C',
        },
        gray: {
          750: '#2d3748',
          850: '#1a202e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.08)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
};
