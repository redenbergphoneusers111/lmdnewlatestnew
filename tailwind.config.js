/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e4e4ff',
          500: '#6C63FF',
          600: '#5b54d9',
          700: '#4a44b3',
        },
        background: '#EAEFF0',
        card: '#FFFFFF',
        text: {
          primary: '#0A1F44',
          secondary: '#707070',
          muted: '#ACB1C0',
        },
        status: {
          completed: '#43C337',
          pending: '#6C93E5',
          cancelled: '#FF2D55',
          postponed: '#E8B73A',
        }
      },
      fontFamily: {
        'sf-display': ['SF UI Display', 'system-ui'],
        'nunito': ['Nunito', 'system-ui'],
      },
      borderRadius: {
        'xl': '15px',
      }
    },
  },
  plugins: [],
}
