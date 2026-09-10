/**
 * Istedama Design Tokens — "Clean Portal" direction
 *
 * A white-and-slate ground instead of the old lavender wash, so content
 * blocks read as the only coloured surfaces on the page. Royal navy #0F3260
 * carries headings, navigation and primary actions; orange #F97316 is
 * reserved for calls to action and live status, never for decoration.
 * Elevation stays light — a card lifts on hover rather than sitting heavy.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /*
         * The mark's blue, not a stock navy. The logo samples at #223E98 —
         * hue 226 deg, saturation 78%, value 60% — where the old ramp's 700
         * was #0F3260: hue 214, and far darker at value 38%. Beside the logo
         * in the header they read as two different blues, and several files
         * had already hard-coded #223E98 to get around it.
         *
         * 700 is now the mark exactly. Every other step holds the same hue.
         */
        navy: {
          50: '#EEF1FA',
          100: '#D8DFF5',
          200: '#B0BEEE',
          300: '#8299E4',
          400: '#506ED2',
          500: '#3452B4',
          600: '#2A47A6',
          700: '#223E98',
          800: '#1A3078',
          900: '#14255C'
        },
        /*
         * Taken from the mark itself, not from a stock palette. The logo's
         * orange samples at #EC9D51 — hue 29 deg, saturation 66% — where the
         * old ramp was Tailwind's orange-500 (#F97316, hue 25 deg, saturation
         * 91%): redder, hotter, and visibly a different colour beside the
         * logo in the header. 500 is now the mark's exact value; 600 and 700
         * are the same hue carried down far enough to hold text.
         */
        gold: {
          50: '#FEF7F0',
          100: '#FCF0E4',
          200: '#F9E2CB',
          300: '#F4CCA6',
          400: '#F0B57C',
          500: '#EC9D51',
          600: '#C4701F',
          700: '#9C5A1B',
          800: '#744314'
        },
        /* الاسم الصريح للاستخدام في الواجهات الجديدة */
        accent: {
          50: '#FEF7F0',
          100: '#FCF0E4',
          200: '#F9E2CB',
          300: '#F4CCA6',
          400: '#F0B57C',
          500: '#EC9D51',
          600: '#C4701F',
          700: '#9C5A1B',
          800: '#744314'
        },
        /*
         * Kept, but demoted to a state colour: success, verified, accepted,
         * awarded. Green carries meaning that navy cannot — a tick that turns
         * blue on success says nothing a grey tick would not. Every decorative
         * use of it (category tints, stat tiles, weight bars, the score seal)
         * has moved to the two brand hues.
         */
        teal: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857'
        },
        /* page ground + decorative washes */
        canvas: '#F7F8FD',
        mist: '#EFF1FA',
        surface: '#FFFFFF',
        rule: '#DFE4F2',
        ink: {
          DEFAULT: '#111834',
          muted: '#66708F',
          soft: '#98A0BC'
        }
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', 'sans-serif'],
        display: ['Tajawal', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      boxShadow: {
        soft: '0 1px 3px rgba(15,50,96,0.05), 0 1px 2px -1px rgba(15,50,96,0.04)',
        card: '0 4px 14px -6px rgba(15,50,96,0.10), 0 2px 5px -2px rgba(15,50,96,0.05)',
        lift: '0 16px 34px -14px rgba(15,50,96,0.24), 0 6px 14px -8px rgba(15,50,96,0.10)',
        pill: '0 6px 20px -8px rgba(15,50,96,0.22)',
        chip: '0 6px 18px -8px rgba(15,50,96,0.20)'
      },
      backgroundImage: {
        'wash-page': 'linear-gradient(180deg, #FFFFFF 0%, #F7F8FD 55%, #EFF1FA 100%)',
        'wash-navy': 'linear-gradient(135deg, #2A47A6 0%, #223E98 55%, #14255C 100%)',
        'wash-hero': 'linear-gradient(135deg, #FFFFFF 0%, #F7F8FD 70%, #EEF1FA 100%)',
        'wash-accent': 'linear-gradient(135deg, #EC9D51 0%, #C4701F 100%)'
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        twinkle: {
          '0%,100%': { opacity: '0.25', transform: 'scale(0.9)' },
          '50%': { opacity: '0.9', transform: 'scale(1.15)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        twinkle: 'twinkle 4s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite'
      }
    }
  },
  plugins: []
};
