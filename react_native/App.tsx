import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, useColorScheme, Animated } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { colors } from './src/theme/colors';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const theme = isDark ? colors.dark : colors.light;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(1))).current;
  
  useEffect(() => {
    // Fade in/out screen transitions
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Scale animations for tabs
    scaleAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: index === activeTab ? 1.1 : 1,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [activeTab]);

  // Animated placeholder screens with theme
  const CalendarScreen = () => (
    <Animated.View style={[styles.screen, { backgroundColor: theme.background, opacity: fadeAnim }]}>
      <Text style={[styles.screenTitle, { color: theme.text }]}>📅 Calendar</Text>
      <Text style={[styles.screenText, { color: theme.secondaryText }]}>
        Step 5: Animations ✓
      </Text>
    </Animated.View>
  );

  const TasksScreen = () => (
    <Animated.View style={[styles.screen, { backgroundColor: theme.background, opacity: fadeAnim }]}>
      <Text style={[styles.screenTitle, { color: theme.text }]}>✓ Tasks</Text>
      <Text style={[styles.screenText, { color: theme.secondaryText }]}>Coming Soon</Text>
    </Animated.View>
  );

  const AIScreen = () => (
    <Animated.View style={[styles.screen, { backgroundColor: theme.background, opacity: fadeAnim }]}>
      <Text style={[styles.screenTitle, { color: theme.text }]}>✨ AI Assistant</Text>
      <Text style={[styles.screenText, { color: theme.secondaryText }]}>Coming Soon</Text>
    </Animated.View>
  );

  const ProfileScreen = () => (
    <Animated.View style={[styles.screen, { backgroundColor: theme.background, opacity: fadeAnim }]}>
      <Text style={[styles.screenTitle, { color: theme.text }]}>👤 Profile</Text>
      <Text style={[styles.screenText, { color: theme.secondaryText }]}>Coming Soon</Text>
    </Animated.View>
  );

  const screens = [CalendarScreen, TasksScreen, AIScreen, ProfileScreen];
  const Screen = screens[activeTab];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        
        {/* Main content */}
        <View style={styles.content}>
          <Screen />
        </View>

        {/* Glass morphism tab bar */}
        <BlurView
          intensity={isDark ? 80 : 95}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.tabBar, {
            borderTopColor: theme.separator,
          }]}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 0 && { backgroundColor: colors.systemBlue }]}
            onPress={() => setActiveTab(0)}
          >
            <Animated.Text style={[styles.tabText, { transform: [{ scale: scaleAnims[0] }] }]}>
              📅
            </Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 1 && { backgroundColor: colors.systemBlue }]}
            onPress={() => setActiveTab(1)}
          >
            <Animated.Text style={[styles.tabText, { transform: [{ scale: scaleAnims[1] }] }]}>
              ✓
            </Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 2 && { backgroundColor: colors.systemBlue }]}
            onPress={() => setActiveTab(2)}
          >
            <Animated.Text style={[styles.tabText, { transform: [{ scale: scaleAnims[2] }] }]}>
              ✨
            </Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 3 && { backgroundColor: colors.systemBlue }]}
            onPress={() => setActiveTab(3)}
          >
            <Animated.Text style={[styles.tabText, { transform: [{ scale: scaleAnims[3] }] }]}>
              👤
            </Animated.Text>
          </TouchableOpacity>
        </BlurView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  screenText: {
    fontSize: 18,
    marginTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 24,
  },
});
