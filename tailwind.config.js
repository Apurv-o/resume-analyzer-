/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep dark backgrounds
        void: {
          DEFAULT: '#080c14',
          1: '#0d1120',
          2: '#111827',
          3: '#1a2235',
        },
        // Glass surface
        surface: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          strong: 'rgba(255,255,255,0.07)',
          border: 'rgba(255,255,255,0.08)',
          'border-strong': 'rgba(255,255,255,0.14)',
        },
        // Brand indigo/violet
        indigo: {
          DEFAULT: '#6366f1',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        violet: {
          DEFAULT: '#8b5cf6',
          400: '#a78bfa',
          500: '#8b5cf6',
        },
        fuchsia: {
          DEFAULT: '#d946ef',
          400: '#e879f9',
        },
        // Status
        emerald: {
          DEFAULT: '#10b981',
          400: '#34d399',
          soft: 'rgba(16,185,129,0.12)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          400: '#fbbf24',
          soft: 'rgba(245,158,11,0.12)',
        },
        rose: {
          DEFAULT: '#ef4444',
          400: '#f87171',
          soft: 'rgba(239,68,68,0.12)',
        },
        // Legacy compat
        desk: {
          DEFAULT: '#080c14',
          dark: '#060910',
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
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        marker: {
          DEFAULT: '#f59e0b',
          soft: '#fef3c7',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        'gradient-x': 'gradient-x 4s ease infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'floaty 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'shimmer': 'shimmer 1.8s infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: {
          '0%': { 'background-position': '-200% center' },
          '100%': { 'background-position': '200% center' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
        'glow-indigo': '0 0 40px -10px rgba(99,102,241,0.6)',
        'glow-violet': '0 0 40px -10px rgba(168,85,247,0.5)',
        'glow-emerald': '0 0 30px -8px rgba(16,185,129,0.5)',
        'glow-amber': '0 0 30px -8px rgba(245,158,11,0.5)',
        'glow-rose': '0 0 30px -8px rgba(239,68,68,0.5)',
      },
    },
  },
  plugins: [],
};
