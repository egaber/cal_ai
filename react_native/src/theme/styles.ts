import { StyleSheet } from 'react-native';
import { colors } from './colors';

// iOS 26 Liquid Glass Effect Styles
export const glassStyles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  
  glassLight: {
    backgroundColor: colors.light.glassBackground,
    borderWidth: 0.5,
    borderColor: colors.light.glassStroke,
  },
  
  glassDark: {
    backgroundColor: colors.dark.glassBackground,
    borderWidth: 0.5,
    borderColor: colors.dark.glassStroke,
  },
  
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

// Common iOS 26 Styles
export const commonStyles = StyleSheet.create({
  // Typography
  h1: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
  },
  
  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  
  h3: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
  
  bodyBold: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  
  callout: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 21,
  },
  
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  
  // Layout
  container: {
    flex: 1,
  },
  
  safeArea: {
    flex: 1,
  },
  
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Shadows (iOS 26 style)
  shadowSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  shadowLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Border Radius (iOS 26 rounded corners)
  roundedSmall: {
    borderRadius: 8,
  },
  
  roundedMedium: {
    borderRadius: 12,
  },
  
  roundedLarge: {
    borderRadius: 16,
  },
  
  roundedXL: {
    borderRadius: 20,
  },
  
  roundedFull: {
    borderRadius: 9999,
  },
  
  // Spacing
  paddingSmall: {
    padding: 8,
  },
  
  paddingMedium: {
    padding: 16,
  },
  
  paddingLarge: {
    padding: 24,
  },
  
  marginSmall: {
    margin: 8,
  },
  
  marginMedium: {
    margin: 16,
  },
  
  marginLarge: {
    margin: 24,
  },
});

// Tab Bar Styles with Liquid Glass
export const tabBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  
  tabBar: {
    flexDirection: 'row',
    height: 65,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  
  tabIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  
  activeTabHighlight: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.15,
  },
});

// Card Styles
export const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  
  cardLight: {
    backgroundColor: colors.light.tertiaryBackground,
  },
  
  cardDark: {
    backgroundColor: colors.dark.tertiaryBackground,
  },
});

export default {
  glass: glassStyles,
  common: commonStyles,
  tabBar: tabBarStyles,
  card: cardStyles,
};
