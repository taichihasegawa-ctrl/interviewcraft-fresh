import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EBF5FB',
          100: '#D6EAF8',
          200: '#AED6F1',
          300: '#85C1E9',
          400: '#5DADE2',
          500: '#2E86C1',
          600: '#1A5276',
          700: '#154360',
          800: '#0E2F44',
          900: '#071D2A',
        },
        accent: {
          50: '#E8F8F5',
          100: '#D1F2EB',
          200: '#A3E4D7',
          300: '#76D7C4',
          400: '#48C9B0',
          500: '#17A589',
          600: '#148F77',
          700: '#117A65',
          800: '#0E6655',
          900: '#0B5345',
        }
      }
    }
  },
  plugins: [],
}
export default config
