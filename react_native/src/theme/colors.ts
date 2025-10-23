// iOS 26 Color Palette
export const colors = {
  // Primary Colors
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // iOS System Colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',

  // Gray Scale
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic Colors (Light Mode)
  light: {
    background: '#FFFFFF',
    secondaryBackground: '#F2F2F7',
    tertiaryBackground: '#FFFFFF',
    groupedBackground: '#F2F2F7',
    
    text: '#000000',
    secondaryText: '#3C3C43',
    tertiaryText: '#3C3C4399',
    placeholderText: '#3C3C434C',
    
    separator: '#3C3C4349',
    opaqueSeparator: '#C6C6C8',
    
    link: '#007AFF',
    
    // Liquid Glass Effect
    glassBackground: 'rgba(242, 242, 247, 0.78)',
    glassStroke: 'rgba(255, 255, 255, 0.25)',
  },

  // Semantic Colors (Dark Mode)
  dark: {
    background: '#000000',
    secondaryBackground: '#1C1C1E',
    tertiaryBackground: '#2C2C2E',
    groupedBackground: '#000000',
    
    text: '#FFFFFF',
    secondaryText: '#EBEBF5',
    tertiaryText: '#EBEBF599',
    placeholderText: '#EBEBF54C',
    
    separator: '#54545899',
    opaqueSeparator: '#38383A',
    
    link: '#0A84FF',
    
    // Liquid Glass Effect
    glassBackground: 'rgba(28, 28, 30, 0.78)',
    glassStroke: 'rgba(255, 255, 255, 0.15)',
  },

  // Calendar Category Colors
  categories: {
    work: '#2196F3',
    personal: '#9C27B0',
    family: '#4CAF50',
    health: '#F44336',
    education: '#FF9800',
    social: '#00BCD4',
    other: '#607D8B',
  },

  // Priority Colors
  priority: {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336',
  },
};

export type ThemeMode = 'light' | 'dark';
