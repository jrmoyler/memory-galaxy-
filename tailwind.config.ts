import type { Config } from 'tailwindcss'

/**
 * Memory Galaxy design tokens.
 * Dark premium cosmic palette (Collective AI Inc-inspired).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#050A18',
        card: '#0D1326',
        gold: '#D4A843',
        teal: '#00D9B5',
        ink: '#F5F5F5',
        silver: '#8B9BAE',
        'galaxy-border': '#1A2540',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(0, 217, 181, 0.25)',
        'glow-gold': '0 0 24px rgba(212, 168, 67, 0.25)',
        panel: '0 8px 40px rgba(0, 0, 0, 0.45)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
