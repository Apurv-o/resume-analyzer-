/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        desk: {
          DEFAULT: '#2F3E36',
          dark: '#222E28',
        },
        paper: {
          DEFAULT: '#FBF9F4',
          line: '#E8E3D6',
          shadow: '#DDD6C4',
        },
        ink: {
          DEFAULT: '#23262B',
          soft: '#5B5F66',
          faint: '#8A8E93',
        },
        pen: {
          DEFAULT: '#C1443C',
          dark: '#9C332C',
        },
        marker: {
          DEFAULT: '#E0AC3F',
          soft: '#F3DFAE',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'felt-texture':
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)',
      },
      backgroundSize: {
        felt: '18px 18px',
      },
      rotate: {
        '-3': '-3deg',
        '2': '2deg',
      },
    },
  },
  plugins: [],
};
