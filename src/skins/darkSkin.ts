import { Skin } from './types';

/**
 * Dark Theme Skin
 * Based on the existing dark mode color scheme
 */
export const darkSkin: Skin = {
  name: 'Dark',
  mode: 'dark',
  
  // Core Colors
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Primary purple
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  
  secondary: {
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
  },
  
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Semantic Colors
  semantic: {
    background: '#000000',
    backgroundSecondary: '#1c1c1e',
    backgroundTertiary: '#2c2c2e',
    backgroundGrouped: '#000000',
    
    text: '#ffffff',
    textSecondary: '#ebebf5',
    textTertiary: '#ebebf599',
    textPlaceholder: '#ebebf54c',
    
    border: '#334155',
    borderOpaque: '#38383a',
    separator: '#54545899',
    
    link: '#0a84ff',
    linkHover: '#409cff',
    
    glassBackground: 'rgba(28, 28, 30, 0.78)',
    glassStroke: 'rgba(255, 255, 255, 0.15)',
    
    input: '#334155',
    inputFocus: '#8b5cf6',
    ring: '#8b5cf6',
  },
  
  // Status Colors
  status: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
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
    },
    info: {
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
    },
  },
  
  // Category Colors (Event types) - Brighter for dark mode
  categories: {
    work: '#60a5fa',        // Lighter Blue
    personal: '#c084fc',    // Lighter Purple
    family: '#60a5fa',      // Lighter Blue
    health: '#4ade80',      // Lighter Green
    education: '#818cf8',   // Lighter Indigo
    social: '#f472b6',      // Lighter Pink
    finance: '#34d399',     // Lighter Green
    home: '#fb923c',        // Lighter Orange
    travel: '#22d3ee',      // Lighter Cyan
    fitness: '#f87171',     // Lighter Red
    food: '#fde047',        // Lighter Yellow
    shopping: '#818cf8',    // Lighter Indigo
    entertainment: '#60a5fa', // Lighter Blue
    sports: '#fb923c',      // Lighter Orange
    other: '#94a3b8',       // Lighter Slate
  },
  
  // Priority Colors (adjusted for dark mode)
  priorities: {
    low: {
      bg: '#14532d',
      text: '#86efac',
      border: '#166534',
    },
    medium: {
      bg: '#713f12',
      text: '#fde047',
      border: '#854d0e',
    },
    high: {
      bg: '#7f1d1d',
      text: '#fca5a5',
      border: '#991b1b',
    },
    critical: {
      bg: '#7f1d1d',
      text: '#fee2e2',
      border: '#b91c1c',
    },
  },
  
  // Time-based Colors (adjusted for dark mode)
  timeBuckets: {
    morning: {
      bg: '#78350f',
      text: '#fed7aa',
    },
    afternoon: {
      bg: '#1e3a8a',
      text: '#bfdbfe',
    },
    evening: {
      bg: '#4c1d95',
      text: '#ddd6fe',
    },
    night: {
      bg: '#312e81',
      text: '#e0e7ff',
    },
  },
  
  dateBuckets: {
    today: {
      bg: '#7f1d1d',
      text: '#fca5a5',
      border: '#991b1b',
    },
    tomorrow: {
      bg: '#78350f',
      text: '#fdba74',
      border: '#9a3412',
    },
    thisWeek: {
      bg: '#713f12',
      text: '#fde047',
      border: '#854d0e',
    },
    nextWeek: {
      bg: '#14532d',
      text: '#86efac',
      border: '#166534',
    },
    later: {
      bg: '#1f2937',
      text: '#d1d5db',
      border: '#374151',
    },
  },
  
  // Special Colors
  accent: '#8b5cf6',
  destructive: '#ef4444',
  muted: '#1e293b',
  
  // Chart Colors (same as light for consistency)
  chart: {
    1: '#8b5cf6',
    2: '#a78bfa',
    3: '#ec4899',
    4: '#3b82f6',
    5: '#10b981',
  },
};
