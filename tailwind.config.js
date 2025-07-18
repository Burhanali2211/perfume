// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', ...defaultTheme.fontFamily.sans],
        display: ['"Playfair Display"', 'Georgia', ...defaultTheme.fontFamily.serif],
        luxury: ['"Cormorant Garamond"', '"Playfair Display"', 'Times New Roman', ...defaultTheme.fontFamily.serif],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', ...defaultTheme.fontFamily.mono],
      },
      // Enhanced typography scale with proper line heights and letter spacing
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.005em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.035em' }],
      },
      colors: {
        // Sophisticated Luxury Color Palette - Neutral-First Design
        primary: {
          50: '#f8fafc',   // Ultra light backgrounds
          100: '#f1f5f9',  // Light backgrounds
          200: '#e2e8f0',  // Subtle borders
          300: '#cbd5e1',  // Disabled states
          400: '#94a3b8',  // Placeholders
          500: '#475569',  // Primary brand - sophisticated slate
          600: '#334155',  // Primary medium
          700: '#1e293b',  // Primary dark
          800: '#0f172a',  // Ultra dark
          900: '#020617',  // Maximum contrast
          DEFAULT: '#475569',
          dark: '#1e293b',
          light: '#cbd5e1',
        },
        secondary: {
          50: '#fafaf9',   // Pure whites
          100: '#f5f5f4',  // Background variations
          200: '#e7e5e4',  // Subtle borders
          300: '#d6d3d1',  // Muted elements
          400: '#a8a29e',  // Secondary text
          500: '#78716c',  // Main secondary
          600: '#57534e',  // Secondary dark
          700: '#44403c',  // Deep secondary
          800: '#292524',  // Very dark
          900: '#1c1917',  // Maximum dark
          DEFAULT: '#78716c',
          light: '#a8a29e',
          dark: '#44403c',
        },
        // Minimal accent - used sparingly for essential UI states only
        accent: {
          50: '#f8fafc',   // Minimal light accent
          100: '#f1f5f9',  // Very subtle
          200: '#e2e8f0',  // Subtle highlight
          300: '#cbd5e1',  // Gentle accent
          400: '#94a3b8',  // Moderate accent
          500: '#64748b',  // Main accent - sophisticated blue-gray
          600: '#475569',  // Accent dark
          700: '#334155',  // Deep accent
          DEFAULT: '#64748b',
          dark: '#475569',
          light: '#cbd5e1',
        },
        // Essential UI state colors - used strategically
        state: {
          success: '#059669',     // Success, security
          error: '#dc2626',       // Error, urgency
          warning: '#d97706',     // Warning, attention
          info: '#0284c7',        // Information
        },
        // Sophisticated neutral palette - primary design foundation
        neutral: {
          50: '#fafaf9',    // Pure white backgrounds
          100: '#f5f5f4',   // Light backgrounds
          200: '#e7e5e4',   // Subtle borders
          300: '#d6d3d1',   // Light borders
          400: '#a8a29e',   // Placeholders, disabled
          500: '#78716c',   // Secondary text
          600: '#57534e',   // Primary text light
          700: '#44403c',   // Primary text
          800: '#292524',   // Dark text
          900: '#1c1917',   // Maximum contrast
          950: '#0c0a09',   // Ultra dark
        },
        // Background system
        background: {
          primary: '#fafaf9',     // Main background
          secondary: '#f5f5f4',   // Card backgrounds
          tertiary: '#ffffff',    // Pure white overlays
        },
        // Text system
        text: {
          primary: '#1c1917',     // Main text
          secondary: '#44403c',   // Secondary text
          tertiary: '#78716c',    // Muted text
          inverse: '#fafaf9',     // Light text on dark
        },
        // Sophisticated trust and conversion colors - luxury appropriate
        trust: {
          blue: '#0f172a',        // Deep sophisticated blue-black
          green: '#059669',       // Refined success green
        },
        conversion: {
          urgency: '#dc2626',     // Sophisticated red for urgency
          warning: '#d97706',     // Refined amber for warnings
        },
      },
      // Luxury spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Sophisticated shadow system
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'luxury': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'luxury-lg': '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
        'luxury-xl': '0 50px 100px -20px rgba(0, 0, 0, 0.35)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-lg': 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
        'focus': '0 0 0 3px rgba(71, 85, 105, 0.1)',
      },
      // Enhanced border radius for luxury feel
      borderRadius: {
        'luxury': '0.75rem',
        'luxury-lg': '1rem',
        'luxury-xl': '1.5rem',
      },
      // Animations removed for performance
    }
  },
  plugins: [],
};
