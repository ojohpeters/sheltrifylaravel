import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.tsx',
        './resources/**/*.ts',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // ── Brand ──────────────────────────────────────────────────
                'brand-primary':   '#00B8B8',
                'brand-secondary': '#008A8A',
                'brand-light':     '#33CCCC',
                'brand-muted':     '#E0F7F7',

                // ── Dark surface system ─────────────────────────────────────
                'dark-bg':           '#07090F',   // page background
                'dark-surface':      '#0C1018',   // card surface
                'dark-card':         '#111827',   // elevated card
                'dark-overlay':      '#1A2235',   // modals, highest surface
                'dark-border':       '#1B2440',   // subtle border
                'dark-border-muted': '#0F1628',   // very subtle
                'dark-text-primary':   '#E2E8F0',
                'dark-text-secondary': '#8B9EC7',
                'dark-text-muted':     '#4A5880',

                // ── Light surface system ────────────────────────────────────
                'light-bg':           '#EEF2F7',  // page background
                'light-surface':      '#F8FBFF',  // secondary surface
                'light-card':         '#FFFFFF',  // card surface
                'light-overlay':      '#FFFFFF',  // modals
                'light-border':       '#D8E0EC',  // subtle border
                'light-border-muted': '#EBF0F8',  // very subtle
                'light-text-primary':   '#1A2040',
                'light-text-secondary': '#5A6986',
                'light-text-muted':     '#9BAABF',
            },

            backgroundImage: {
                'brand-gradient':      'linear-gradient(135deg, #00B8B8 0%, #0077CC 100%)',
                'brand-gradient-soft': 'linear-gradient(135deg, rgba(0,184,184,0.15) 0%, rgba(0,119,204,0.15) 100%)',
                'dark-gradient':       'linear-gradient(180deg, #07090F 0%, #0C1018 100%)',
                'hero-glow':           'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,184,184,0.25), transparent)',
            },

            boxShadow: {
                'brand-sm':  '0 2px 12px rgba(0,184,184,0.18)',
                'brand-md':  '0 4px 24px rgba(0,184,184,0.25)',
                'brand-lg':  '0 8px 40px rgba(0,184,184,0.30)',
                'card':      '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
                'card-md':   '0 4px 16px rgba(0,0,0,0.16), 0 2px 4px rgba(0,0,0,0.08)',
                'card-lg':   '0 16px 48px rgba(0,0,0,0.24), 0 8px 16px rgba(0,0,0,0.10)',
                'glass':     '0 8px 32px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.06)',
                'bottom-nav':'0 -1px 0 rgba(255,255,255,0.06), 0 -8px 32px rgba(0,0,0,0.32)',
            },

            keyframes: {
                'new-message-animation': {
                    '0%':   { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                'toast-in-out': {
                    '0%':   { transform: 'translateX(100%)', opacity: '0' },
                    '10%':  { transform: 'translateX(0)',    opacity: '1' },
                    '85%':  { transform: 'translateX(0)',    opacity: '1' },
                    '100%': { transform: 'translateX(100%)', opacity: '0' },
                },
                'fade-up': {
                    '0%':   { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%':   { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up': {
                    '0%':   { opacity: '0', transform: 'translateY(24px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-down': {
                    '0%':   { opacity: '0', transform: 'translateY(-12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'scale-in': {
                    '0%':   { opacity: '0', transform: 'scale(0.92)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,184,184,0.4)' },
                    '50%':      { boxShadow: '0 0 0 8px rgba(0,184,184,0)' },
                },
                'shimmer': {
                    '0%':   { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%':      { transform: 'translateY(-6px)' },
                },
                'sheet-up': {
                    '0%':   { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
            },

            animation: {
                'new-message': 'new-message-animation 0.3s ease-out forwards',
                'toast':       'toast-in-out 3.5s ease-in-out forwards',
                'fade-up':     'fade-up 0.4s ease-out forwards',
                'fade-in':     'fade-in 0.3s ease-out forwards',
                'slide-up':    'slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
                'slide-down':  'slide-down 0.25s ease-out forwards',
                'scale-in':    'scale-in 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
                'pulse-glow':  'pulse-glow 2s ease-in-out infinite',
                'shimmer':     'shimmer 2s linear infinite',
                'float':       'float 3s ease-in-out infinite',
                'sheet-up':    'sheet-up 0.4s cubic-bezier(0.32,0.72,0,1) forwards',
            },

            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },

            spacing: {
                'safe-b': 'env(safe-area-inset-bottom)',
                '18': '4.5rem',
                '22': '5.5rem',
            },
        },
    },
    plugins: [],
};
