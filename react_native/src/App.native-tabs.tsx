// This version uses NATIVE tabs with react-native-bottom-tabs
// IMPORTANT: This ONLY works with:
// - Expo Development Build (eas build)
// - OR ejected bare React Native app
// It will NOT work in Expo Go!

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

// Simple screens
const CalendarScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>📅 Calendar</Text>
    <Text>Native Tabs!</Text>
  </View>
);

const TasksScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>✓ Tasks</Text>
  </View>
);

const AIScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>✨ AI Assistant</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>👤 Profile</Text>
  </View>
);

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
          },
          tabBarBackground: () => (
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
            }} />
          ),
        }}
      >
        <Tab.Screen 
          name="Calendar" 
          component={CalendarScreen}
          options={{
            tabBarLabel: '📅',
          }}
        />
        <Tab.Screen 
          name="Tasks" 
          component={TasksScreen}
          options={{
            tabBarLabel: '✓',
          }}
        />
        <Tab.Screen 
          name="AI" 
          component={AIScreen}
          options={{
            tabBarLabel: '✨',
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            tabBarLabel: '👤',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
});
