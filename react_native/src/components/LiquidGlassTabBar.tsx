import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { tabBarStyles, glassStyles } from '../theme/styles';

interface Tab {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface LiquidGlassTabBarProps {
  tabs: Tab[];
  activeTab: number;
  onTabPress: (index: number) => void;
}

const LiquidGlassTabBar: React.FC<LiquidGlassTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Use standard Animated API instead of Reanimated
  const liquidPosition = useRef(new Animated.Value(activeTab)).current;
  const iconScalesRef = useRef<Animated.Value[]>([]);
  
  // Initialize icon scales if not already done
  if (iconScalesRef.current.length !== tabs.length) {
    iconScalesRef.current = tabs.map(() => new Animated.Value(1));
  }
  const iconScales = iconScalesRef.current;
  
  useEffect(() => {
    // Animate liquid background
    Animated.spring(liquidPosition, {
      toValue: activeTab,
      damping: 20,
      stiffness: 90,
      useNativeDriver: true,
    }).start();
    
    // Animate icons
    iconScales.forEach((scale, index) => {
      Animated.spring(scale, {
        toValue: index === activeTab ? 1.1 : 1,
        damping: 20,
        stiffness: 90,
        useNativeDriver: true,
      }).start();
    });
  }, [activeTab]);
  
  const translateX = liquidPosition.interpolate({
    inputRange: [0, tabs.length - 1],
    outputRange: [0, (tabs.length - 1) * (100 / tabs.length)],
  });
  
  return (
    <View style={tabBarStyles.container}>
      <BlurView
        intensity={isDark ? 30 : 50}
        tint={isDark ? 'dark' : 'light'}
        style={[
          tabBarStyles.tabBar,
          isDark ? glassStyles.glassDark : glassStyles.glassLight,
          styles.tabBarGlass,
        ]}
      >
        {/* Liquid background indicator */}
        <Animated.View
          style={[
            styles.liquidBackground,
            {
              width: `${100 / tabs.length}%`,
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                : ['rgba(0, 122, 255, 0.15)', 'rgba(0, 122, 255, 0.08)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.liquidGradient}
          />
        </Animated.View>
        
        {/* Tab items */}
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={tabBarStyles.tabItem}
              onPress={() => onTabPress(index)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  tabBarStyles.tabIconContainer,
                  {
                    transform: [{ scale: iconScales[index] }],
                  },
                ]}
              >
                {isActive && (
                  <View
                    style={[
                      tabBarStyles.activeTabHighlight,
                      {
                        backgroundColor: isDark
                          ? colors.dark.link
                          : colors.light.link,
                      },
                    ]}
                  />
                )}
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={
                    isActive
                      ? isDark
                        ? colors.dark.link
                        : colors.light.link
                      : isDark
                      ? colors.dark.secondaryText
                      : colors.light.secondaryText
                  }
                />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarGlass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  
  liquidBackground: {
    position: 'absolute',
    height: '100%',
    borderRadius: 32,
    overflow: 'hidden',
  },
  
  liquidGradient: {
    flex: 1,
    borderRadius: 32,
  },
});

export default LiquidGlassTabBar;
