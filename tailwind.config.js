/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/frontend/pages/**/*.{js,ts,jsx,tsx}',
    './src/frontend/components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium Legal Platform Color Palette
        navy: {
          50: '#f0f4ff',
          100: '#e0ebff',
          200: '#c7d7ff',
          300: '#a5b9ff',
          400: '#8190ff',
          500: '#5c6cfa',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#1e1b4b',
          950: '#0f0a2e',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        
        // Legacy colors for backward compatibility
        'quebec-blue': '#1e1b4b',
        'trust-blue': '#4338ca',
        'heritage-gold': '#fbbf24',
        
        // Professional Gray Scale
        'professional-gray': '#374151',
        'warm-gray': '#6b7280',
        'light-gray': '#9ca3af',
        
        // Quebec Color Variants
        quebec: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003f99',
          800: '#003f88',
          900: '#002b66',
          DEFAULT: '#003f88',
        },
        
        // Trust Blue Variants
        trust: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#1e40af',
        },
        
        // Success Green Variants
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#059669',
        },
        
        // Warning Orange Variants
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#f59e0b',
        },
        
        // Error Red Variants
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          DEFAULT: '#dc2626',
        },
        
        // Professional Background Colors
        background: {
          primary: '#ffffff',
          secondary: '#f9fafb',
          tertiary: '#f3f4f6',
          dark: '#003f88',
        },
        
        // Border Colors
        border: {
          light: '#f3f4f6',
          DEFAULT: '#e5e7eb',
          dark: '#d1d5db',
        },
      },
      
      fontFamily: {
        sans: [
          'Inter', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'sans-serif'
        ],
        serif: [
          'Georgia', 
          'Times New Roman', 
          'serif'
        ],
        mono: [
          'SF Mono', 
          'Monaco', 
          'Inconsolata', 
          'Roboto Mono', 
          'monospace'
        ],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      
      boxShadow: {
        'premium-sm': '0 1px 2px 0 rgba(30, 27, 75, 0.05)',
        'premium-md': '0 4px 6px -1px rgba(30, 27, 75, 0.1), 0 2px 4px -1px rgba(30, 27, 75, 0.06)',
        'premium-lg': '0 10px 15px -3px rgba(30, 27, 75, 0.1), 0 4px 6px -2px rgba(30, 27, 75, 0.05)',
        'premium-xl': '0 20px 25px -5px rgba(30, 27, 75, 0.1), 0 10px 10px -5px rgba(30, 27, 75, 0.04)',
        'premium-2xl': '0 25px 50px -12px rgba(30, 27, 75, 0.25)',
        'premium-inner': 'inset 0 2px 4px 0 rgba(30, 27, 75, 0.06)',
        'glow': '0 0 20px rgba(251, 191, 36, 0.3)',
        'glow-lg': '0 0 40px rgba(251, 191, 36, 0.4)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        // Legacy
        'quebec-sm': '0 1px 2px 0 rgba(0, 63, 136, 0.05)',
        'quebec-md': '0 4px 6px -1px rgba(0, 63, 136, 0.1), 0 2px 4px -1px rgba(0, 63, 136, 0.06)',
        'quebec-lg': '0 10px 15px -3px rgba(0, 63, 136, 0.1), 0 4px 6px -2px rgba(0, 63, 136, 0.05)',
        'quebec-xl': '0 20px 25px -5px rgba(0, 63, 136, 0.1), 0 10px 10px -5px rgba(0, 63, 136, 0.04)',
        'quebec-2xl': '0 25px 50px -12px rgba(0, 63, 136, 0.25)',
        'quebec-inner': 'inset 0 2px 4px 0 rgba(0, 63, 136, 0.06)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-in-bounce': 'scaleInBounce 0.4s ease-out',
        'pulse-quebec': 'pulseQuebec 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleInBounce: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseQuebec: {
          '0%, 100%': { 
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': { 
            opacity: '0.8',
            transform: 'scale(1.05)',
          },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(251, 191, 36, 0.6)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #1e1b4b 0%, #0f0a2e 100%)',
        'gradient-navy-soft': 'linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)',
        'gradient-gold': 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
        'gradient-premium': 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #fbbf24 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0f0a2e 0%, #1e1b4b 50%, #4338ca 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        // Legacy
        'gradient-quebec': 'linear-gradient(135deg, #003f88 0%, #1e40af 100%)',
        'gradient-success': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      },
      
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
      
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    // Custom plugin for Quebec-specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-quebec': {
          color: theme('colors.quebec.DEFAULT'),
        },
        '.bg-quebec': {
          backgroundColor: theme('colors.quebec.DEFAULT'),
        },
        '.border-quebec': {
          borderColor: theme('colors.quebec.DEFAULT'),
        },
        '.focus-quebec': {
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.quebec.200')}`,
            borderColor: theme('colors.quebec.DEFAULT'),
          },
        },
        '.btn-quebec': {
          backgroundColor: theme('colors.quebec.DEFAULT'),
          color: 'white',
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.quebec.700'),
            transform: 'scale(1.05)',
            boxShadow: theme('boxShadow.quebec-lg'),
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.quebec.200')}`,
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
};