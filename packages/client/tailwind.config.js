/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Off-black neutral base (no pure #000)
        ink: {
          950: '#0b0c0e',
          900: '#101216',
          800: '#161a20',
          700: '#1d2128',
          600: '#262b34',
          500: '#3a414d',
          400: '#5a6373',
          300: '#8a93a3',
          200: '#b8bfcc',
          100: '#dde1e8',
          50: '#eef0f4',
        },
        // Single desaturated accent — quiet emerald (no AI purple, < 80% sat)
        signal: {
          DEFAULT: '#3fa57f',
          fg: '#9ee0c2',
          bg: '#0e2a22',
          line: '#1e4a3c',
        },
        // Status semantics (also desaturated)
        warn: '#c79b4a',
        rouge: '#c46a6a',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        'tightest': '-0.04em',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.12)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'modal-in': 'modal-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
        'breathe': 'breathe 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
