/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#111827',
          hover: '#000000',
        },
        accent: '#2563eb',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        cardHover: '0 4px 16px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
