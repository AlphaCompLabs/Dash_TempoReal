/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#020047',
        'secondary': '#79A9BB',
        'accent': {
          'light': '#ACE5E9',
        },
        'dark': {
          'DEFAULT': '#19191B',
          'black': '#000000',
        },
        'chart': {
          'blue-light': '#4BB8E1',
          'blue-dark': '#0D6282',
          'teal-light': '#4BE1C6',
          'teal-dark': '#0D8274',
        }
      },
      fontFamily: {
        'sans': ['Montserrat', 'sans-serif'],
        'display': ['"Saved By Zero"'],
      }
    },
  },
  plugins: [],
};