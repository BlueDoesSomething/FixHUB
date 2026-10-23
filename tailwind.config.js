/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#146344',
          primaryDark: '#0F4A32',
          primaryLight: '#E8F5EE',
          primaryMuted: '#D1E7DD',
          accent: '#F79D1F',
          accentHover: '#E88E15',
        },
      },
    },
  },
  plugins: [],
}
