import { Skin } from './types';

/**
 * Light Theme Skin
 * Based on the existing light mode color scheme
 */
export const lightSkin: Skin = {
  name: 'Light',
  mode: 'light',
  
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
    background: '#ffffff',
    backgroundSecondary: '#f2f2f7',
    backgroundTertiary: '#ffffff',
    backgroundGrouped: '#f2f2f7',
    
    text: '#000000',
    textSecondary: '#3c3c43',
    textTertiary: '#3c3c4399',
    textPlaceholder: '#3c3c434c',
    
    border: '#e2e8f0',
    borderOpaque: '#c6c6c8',
    separator: '#3c3c4349',
    
    link: '#007aff',
    linkHover: '#0056b3',
    
    glassBackground: 'rgba(242, 242, 247, 0.78)',
    glassStroke: 'rgba(255, 255, 255, 0.25)',
    
    input: '#e2e8f0',
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
  
  // Category Colors (Event types)
  categories: {
    work: '#3b82f6',        // Blue
    personal: '#a855f7',    // Purple
    family: '#3b82f6',      // Blue
    health: '#10b981',      // Green
    education: '#6366f1',   // Indigo
    social: '#ec4899',      // Pink
    finance: '#059669',     // Green-600
    home: '#f97316',        // Orange
    travel: '#06b6d4',      // Cyan
    fitness: '#ef4444',     // Red
    food: '#eab308',        // Yellow
    shopping: '#6366f1',    // Indigo
    entertainment: '#3b82f6', // Blue
    sports: '#ea580c',      // Orange-600
    other: '#64748b',       // Slate
  },
  
  // Priority Colors
  priorities: {
    low: {
      bg: '#dcfce7',
      text: '#166534',
      border: '#bbf7d0',
    },
    medium: {
      bg: '#fef9c3',
      text: '#854d0e',
      border: '#fef08a',
    },
    high: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#fecaca',
    },
    critical: {
      bg: '#fee2e2',
      text: '#7f1d1d',
      border: '#fca5a5',
    },
  },
  
  // Time-based Colors
  timeBuckets: {
    morning: {
      bg: '#fed7aa',
      text: '#9a3412',
    },
    afternoon: {
      bg: '#bfdbfe',
      text: '#1e40af',
    },
    evening: {
      bg: '#ddd6fe',
      text: '#5b21b6',
    },
    night: {
      bg: '#e0e7ff',
      text: '#3730a3',
    },
  },
  
  dateBuckets: {
    today: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#fecaca',
    },
    tomorrow: {
      bg: '#fed7aa',
      text: '#9a3412',
      border: '#fdba74',
    },
    thisWeek: {
      bg: '#fef9c3',
      text: '#854d0e',
      border: '#fef08a',
    },
    nextWeek: {
      bg: '#dcfce7',
      text: '#166534',
      border: '#bbf7d0',
    },
    later: {
      bg: '#f3f4f6',
      text: '#374151',
      border: '#e5e7eb',
    },
  },
  
  // Special Colors
  accent: '#8b5cf6',
  destructive: '#ef4444',
  muted: '#f1f5f9',
  
  // Chart Colors
  chart: {
    1: '#8b5cf6',
    2: '#a78bfa',
    3: '#ec4899',
    4: '#3b82f6',
    5: '#10b981',
  },
};
