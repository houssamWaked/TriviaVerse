// Centralized color system for TriviaVerse UI
// Matches gradients, buttons, cards, and game modes

const colors = {
  // ===== Brand / Primary =====
  primary: {
    50: '#f5e9ff',
    100: '#e6cfff',
    200: '#d0a6ff',
    300: '#ba7dff',
    400: '#a455ff',
    500: '#8b2cff', // main brand
    600: '#7422d6',
    700: '#5d1aad',
    800: '#461284',
    900: '#2f0a5b',
  },

  // ===== Secondary / Pink =====
  secondary: {
    50: '#ffe9f2',
    100: '#ffd0e4',
    200: '#ffa6cb',
    300: '#ff7db2',
    400: '#ff5599',
    500: '#ff2c80',
    600: '#d62269',
    700: '#ad1a52',
    800: '#84123b',
    900: '#5b0a24',
  },

  // ===== Accent Colors =====
  accent: {
    yellow: '#ffcc00', // stars, rewards
    orange: '#ff9f1c', // millionaire
    green: '#22c55e', // correct / success
    red: '#ef4444', // wrong / danger
    blue: '#3b82f6', // info
  },

  // ===== Game Mode Colors =====
  modes: {
    story: '#3b82f6', // blue
    millionaire: '#f59e0b', // gold
    classic: '#a855f7', // purple
    blitz: '#ef4444', // red
    custom: '#22c55e', // green
  },

  // ===== Background Gradients =====
  gradients: {
    main: 'linear-gradient(135deg, #8b2cff 0%, #ff2c80 100%)',
    story: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
    millionaire: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    classic: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    blitz: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
  },

  // ===== Neutral / UI =====
  neutral: {
    white: '#ffffff',
    black: '#000000',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2933',
    900: '#111827',
  },

  // ===== Status =====
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};

export default colors;
