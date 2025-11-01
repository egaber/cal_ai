import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { colors } from '../theme/colors';
import { commonStyles, glassStyles } from '../theme/styles';
import { CalendarEvent } from '../types/calendar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 60;

const CalendarScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | '3day'>('day');

  // Mock data - will be replaced with Firebase data
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Team Meeting',
      startTime: new Date(currentDate.setHours(10, 0)).toISOString(),
      endTime: new Date(currentDate.setHours(11, 0)).toISOString(),
      category: 'work',
      priority: 'high',
      memberId: '1',
      emoji: '💼',
    },
    {
      id: '2',
      title: 'Lunch with Family',
      startTime: new Date(currentDate.setHours(12, 30)).toISOString(),
      endTime: new Date(currentDate.setHours(13, 30)).toISOString(),
      category: 'family',
      priority: 'medium',
      memberId: '1',
      emoji: '🍽️',
    },
  ];

  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else if (direction === 'prev') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - (viewMode === 'day' ? 1 : 3))));
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + (viewMode === 'day' ? 1 : 3))));
    }
  };

  const renderEvent = (event: CalendarEvent) => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    
    const top = (startHour + startMinute / 60) * HOUR_HEIGHT;
    const height = ((endHour - startHour) + (endMinute - startMinute) / 60) * HOUR_HEIGHT;

    return (
      <View
        key={event.id}
        style={[
          styles.eventCard,
          {
            top,
            height: Math.max(height, 40),
            backgroundColor: colors.categories[event.category],
          },
        ]}
      >
        <TouchableOpacity 
          style={{ flex: 1 }}
          activeOpacity={0.8}
        >
          <Text style={styles.eventEmoji}>{event.emoji}</Text>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.eventTime}>
            {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Glass Effect */}
      <BlurView
        intensity={isDark ? 30 : 50}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.header,
          isDark ? glassStyles.glassDark : glassStyles.glassLight,
        ]}
      >
        <View style={styles.headerTop}>
          <Text
            style={[
              commonStyles.h2,
              { color: isDark ? colors.dark.text : colors.light.text },
            ]}
          >
            {format(currentDate, 'MMMM yyyy')}
          </Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => navigateDate('today')}
            >
              <Text style={[styles.todayText, { color: colors.systemBlue }]}>
                Today
              </Text>
            </TouchableOpacity>
            
            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'day' && styles.viewModeButtonActive,
                ]}
                onPress={() => setViewMode('day')}
              >
                <Text
                  style={[
                    styles.viewModeText,
                    viewMode === 'day' && styles.viewModeTextActive,
                  ]}
                >
                  1D
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === '3day' && styles.viewModeButtonActive,
                ]}
                onPress={() => setViewMode('3day')}
              >
                <Text
                  style={[
                    styles.viewModeText,
                    viewMode === '3day' && styles.viewModeTextActive,
                  ]}
                >
                  3D
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Week Dates */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekDates}
        >
          {weekDates.map((date) => {
            const isSelected = isSameDay(date, currentDate);
            const isTodayDate = isToday(date);

            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.dateButton,
                  isSelected && styles.dateButtonActive,
                  isTodayDate && !isSelected && styles.dateButtonToday,
                ]}
                onPress={() => setCurrentDate(date)}
              >
                <Text
                  style={[
                    styles.dateDay,
                    isSelected && styles.dateDayActive,
                  ]}
                >
                  {format(date, 'EEE')}
                </Text>
                <Text
                  style={[
                    styles.dateNumber,
                    isSelected && styles.dateNumberActive,
                  ]}
                >
                  {format(date, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BlurView>

      {/* Calendar Grid */}
      <ScrollView 
        style={styles.calendarContainer}
        contentContainerStyle={styles.calendarContent}
      >
        <View style={styles.timeColumn}>
          {hours.map((hour) => (
            <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
              <Text
                style={[
                  styles.hourText,
                  { color: isDark ? colors.dark.secondaryText : colors.light.secondaryText },
                ]}
              >
                {format(new Date().setHours(hour, 0), 'HH:mm')}
              </Text>
              <View
                style={[
                  styles.hourLine,
                  { borderColor: isDark ? colors.dark.separator : colors.light.separator },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Events */}
        <View style={styles.eventsContainer}>
          {mockEvents.map((event) => renderEvent(event))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <LinearGradient
          colors={['#007AFF', '#5856D6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarContainer: {
    flex: 1,
  },
  calendarContent: {
    paddingBottom: 100, // Space for tab bar at bottom
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  todayText: {
    fontSize: 15,
    fontWeight: '600',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: 'white',
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  viewModeTextActive: {
    color: '#000',
  },
  weekDates: {
    paddingVertical: 8,
    gap: 8,
  },
  dateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 60,
    borderRadius: 12,
  },
  dateButtonActive: {
    backgroundColor: colors.systemBlue,
  },
  dateButtonToday: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  dateDayActive: {
    color: 'white',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  dateNumberActive: {
    color: 'white',
  },
  timeColumn: {
    paddingLeft: 16,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hourText: {
    fontSize: 12,
    width: 50,
    marginTop: -6,
  },
  hourLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    marginLeft: 8,
  },
  eventsContainer: {
    position: 'absolute',
    left: 74,
    right: 16,
    top: 0,
  },
  eventCard: {
    position: 'absolute',
    width: '100%',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CalendarScreen;
