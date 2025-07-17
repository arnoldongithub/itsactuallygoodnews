/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#A69CFF',   // primary text/brand color
          mint: '#A7E6C4',      // accent (speech bubble, cards)
          yellow: '#FEE8A0',    // highlights (sun)
          coral: '#F99C8B',     // alternate highlight (sun base)
          cream: '#FCF8F4',     // light mode background
        },
        category: {
          health: '#F99C8B',
          innovation: '#A7E6C4',
          environment: '#B2F2BB',
          education: '#A69CFF',
          science: '#9AD0F5',
          space: '#D0BFFF',
          humanitarian: '#FFD6A5',
        },
        dark: {
          bg: '#1F1F1F',
          card: '#2A2A2A',
          text: '#E5E5E5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '4.5': '1.125rem',
        '15': '3.75rem',
        '18': '4.5rem',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            a: {
              color: theme('colors.brand.DEFAULT'),
              '&:hover': {
                color: theme('colors.brand.coral'),
              },
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.dark.text'),
            a: {
              color: theme('colors.brand.yellow'),
              '&:hover': {
                color: theme('colors.brand.coral'),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
