import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

interface SimpleCalendarScreenProps {
  theme: typeof colors.dark | typeof colors.light;
  isDark: boolean;
}

const SimpleCalendarScreen = ({ theme, isDark }: SimpleCalendarScreenProps) => {

  // Mock events for demo
  const events = [
    { id: 1, time: '09:00', title: 'Team Meeting', color: colors.systemBlue },
    { id: 2, time: '11:30', title: 'Design Review', color: colors.systemPurple },
    { id: 3, time: '14:00', title: 'Lunch Break', color: colors.systemGreen },
    { id: 4, time: '16:00', title: 'Code Review', color: colors.systemOrange },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Today</Text>
        <Text style={[styles.headerDate, { color: theme.secondaryText }]}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      {/* Events List */}
      <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
        {events.map((event) => (
          <View
            key={event.id}
            style={[
              styles.eventCard,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                borderLeftColor: event.color,
              },
            ]}
          >
            <Text style={[styles.eventTime, { color: theme.secondaryText }]}>
              {event.time}
            </Text>
            <Text style={[styles.eventTitle, { color: theme.text }]}>
              {event.title}
            </Text>
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.secondaryText }]}>
            ✓ Step 6: Calendar Complete
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 16,
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  eventTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    fontSize: 14,
  },
});

export default SimpleCalendarScreen;
