/**
 * Skin System Types
 * Central type definitions for the theming system
 */

export type ThemeMode = 'light' | 'dark';

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SemanticColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  backgroundGrouped: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textPlaceholder: string;
  
  // Borders & Separators
  border: string;
  borderOpaque: string;
  separator: string;
  
  // Interactive
  link: string;
  linkHover: string;
  
  // Glass Effects
  glassBackground: string;
  glassStroke: string;
  
  // Input
  input: string;
  inputFocus: string;
  ring: string;
}

export interface StatusColors {
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
}

export interface CategoryColors {
  work: string;
  personal: string;
  family: string;
  health: string;
  education: string;
  social: string;
  finance: string;
  home: string;
  travel: string;
  fitness: string;
  food: string;
  shopping: string;
  entertainment: string;
  sports: string;
  other: string;
}

export interface PriorityColors {
  low: {
    bg: string;
    text: string;
    border: string;
  };
  medium: {
    bg: string;
    text: string;
    border: string;
  };
  high: {
    bg: string;
    text: string;
    border: string;
  };
  critical: {
    bg: string;
    text: string;
    border: string;
  };
}

export interface TimeBucketColors {
  morning: {
    bg: string;
    text: string;
  };
  afternoon: {
    bg: string;
    text: string;
  };
  evening: {
    bg: string;
    text: string;
  };
  night: {
    bg: string;
    text: string;
  };
}

export interface DateBucketColors {
  today: {
    bg: string;
    text: string;
    border: string;
  };
  tomorrow: {
    bg: string;
    text: string;
    border: string;
  };
  thisWeek: {
    bg: string;
    text: string;
    border: string;
  };
  nextWeek: {
    bg: string;
    text: string;
    border: string;
  };
  later: {
    bg: string;
    text: string;
    border: string;
  };
}

export interface Skin {
  name: string;
  mode: ThemeMode;
  
  // Core Colors
  primary: ColorScale;
  secondary: ColorScale;
  gray: ColorScale;
  
  // Semantic Colors
  semantic: SemanticColors;
  
  // Status Colors
  status: StatusColors;
  
  // Category Colors
  categories: CategoryColors;
  
  // Priority Colors
  priorities: PriorityColors;
  
  // Time-based Colors
  timeBuckets: TimeBucketColors;
  dateBuckets: DateBucketColors;
  
  // Special Colors
  accent: string;
  destructive: string;
  muted: string;
  
  // Chart Colors
  chart: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
}
