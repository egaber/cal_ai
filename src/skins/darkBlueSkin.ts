import { Skin } from './types';

/**
 * Dark Blue Theme Skin
 * A cooler, more professional dark theme using blue/cyan accents instead of purple
 */
export const darkBlueSkin: Skin = {
  name: 'Dark Blue',
  mode: 'dark',
  
  // Core Colors - Blue theme
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  secondary: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // Cyan accent
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  
  gray: {
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
  
  // Semantic Colors
  semantic: {
    background: '#020617',      // Darker slate
    backgroundSecondary: '#0f172a',
    backgroundTertiary: '#1e293b',
    backgroundGrouped: '#020617',
    
    text: '#f8fafc',
    textSecondary: '#e2e8f0',
    textTertiary: '#cbd5e199',
    textPlaceholder: '#94a3b84c',
    
    border: '#334155',
    borderOpaque: '#475569',
    separator: '#33415599',
    
    link: '#3b82f6',
    linkHover: '#60a5fa',
    
    glassBackground: 'rgba(15, 23, 42, 0.78)',
    glassStroke: 'rgba(147, 197, 253, 0.15)',
    
    input: '#1e293b',
    inputFocus: '#3b82f6',
    ring: '#3b82f6',
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
  
  // Category Colors (Event types) - Blue/Cyan themed for dark mode
  categories: {
    work: '#60a5fa',        // Blue
    personal: '#22d3ee',    // Cyan
    family: '#93c5fd',      // Light Blue
    health: '#4ade80',      // Green
    education: '#60a5fa',   // Blue
    social: '#a5f3fc',      // Light Cyan
    finance: '#34d399',     // Green
    home: '#fb923c',        // Orange
    travel: '#06b6d4',      // Cyan
    fitness: '#f87171',     // Red
    food: '#fde047',        // Yellow
    shopping: '#67e8f9',    // Cyan
    entertainment: '#7dd3fc', // Sky Blue
    sports: '#fb923c',      // Orange
    other: '#94a3b8',       // Slate
  },
  
  // Priority Colors (adjusted for dark blue theme)
  priorities: {
    low: {
      bg: '#14532d',
      text: '#86efac',
      border: '#166534',
    },
    medium: {
      bg: '#0e7490',
      text: '#67e8f9',
      border: '#155e75',
    },
    high: {
      bg: '#1e40af',
      text: '#93c5fd',
      border: '#1d4ed8',
    },
    critical: {
      bg: '#7f1d1d',
      text: '#fee2e2',
      border: '#b91c1c',
    },
  },
  
  // Time-based Colors (blue/cyan themed)
  timeBuckets: {
    morning: {
      bg: '#0e7490',
      text: '#a5f3fc',
    },
    afternoon: {
      bg: '#1e40af',
      text: '#bfdbfe',
    },
    evening: {
      bg: '#1e3a8a',
      text: '#93c5fd',
    },
    night: {
      bg: '#0f172a',
      text: '#cbd5e1',
    },
  },
  
  dateBuckets: {
    today: {
      bg: '#7f1d1d',
      text: '#fca5a5',
      border: '#991b1b',
    },
    tomorrow: {
      bg: '#1e40af',
      text: '#93c5fd',
      border: '#1d4ed8',
    },
    thisWeek: {
      bg: '#0e7490',
      text: '#67e8f9',
      border: '#155e75',
    },
    nextWeek: {
      bg: '#14532d',
      text: '#86efac',
      border: '#166534',
    },
    later: {
      bg: '#1e293b',
      text: '#cbd5e1',
      border: '#334155',
    },
  },
  
  // Special Colors - Blue themed
  accent: '#3b82f6',
  destructive: '#ef4444',
  muted: '#1e293b',
  
  // Chart Colors - Blue/Cyan palette
  chart: {
    1: '#3b82f6',
    2: '#60a5fa',
    3: '#22d3ee',
    4: '#06b6d4',
    5: '#10b981',
  },
};
