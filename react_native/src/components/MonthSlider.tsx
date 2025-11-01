import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Vibration,
  Platform,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';

interface MonthSliderProps {
  theme: typeof colors.dark | typeof colors.light;
  isDark: boolean;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SLIDER_HEIGHT = SCREEN_HEIGHT * 0.7; // 70% for more calendar space

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const DRAG_ACTIVATION_THRESHOLD = 6;
const LONG_PRESS_DURATION = 350;

// Helper to generate calendar grid
const generateCalendarDays = (year: number, month: number, today: Date) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const days: Array<{date: Date; day: number; isCurrentMonth: boolean; isToday: boolean}> = [];
  
  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isToday: false,
    });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString(),
    });
  }
  
  // Next month days to complete the grid
  const remainingDays = 42 - days.length; // 6 rows x 7 days
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      day,
      isCurrentMonth: false,
      isToday: false,
    });
  }
  
  // Group into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  
  return weeks;
};

export const MonthSlider = ({ theme, isDark, currentDate, onDateChange }: MonthSliderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dragStartValue = useRef(0);
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressActivated = useRef(false);
  const hasExceededDragThreshold = useRef(false);
  const [overlayActive, setOverlayActive] = useState(false);
  
  const clearLongPressTimeout = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };
  
  useEffect(() => {
    const listenerId = slideAnim.addListener(({ value }) => {
      setOverlayActive(value > 0.01);
    });
    return () => {
      slideAnim.removeListener(listenerId);
      clearLongPressTimeout();
    };
  }, [slideAnim]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const calendarWeeks = generateCalendarDays(selectedYear, selectedMonth, new Date());

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(type === 'light' ? 10 : type === 'medium' ? 20 : 30);
    } else {
      Vibration.vibrate(type === 'light' ? 10 : type === 'medium' ? 20 : 30);
    }
  };

  const animateSlide = (toValue: 0 | 1, triggerHaptic = true) => {
    if (triggerHaptic) {
      hapticFeedback(toValue === 1 ? 'medium' : 'light');
    }

    if (toValue === 1) {
      setIsOpen(true);
    }

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(overlayOpacity, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (toValue === 0) {
        setIsOpen(false);
      }
    });
  };

  const handleDaySelect = (date: Date) => {
    hapticFeedback('medium');
    onDateChange(date);
    animateSlide(0);
  };

  const handleMonthSelect = (monthIndex: number) => {
    hapticFeedback('light');
    setSelectedMonth(monthIndex);
  };

  const handleYearSelect = (year: number) => {
    hapticFeedback('light');
    setSelectedYear(year);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => false,
      onPanResponderGrant: () => {
        hapticFeedback('light');
        setIsDragging(true);
        hasExceededDragThreshold.current = false;
        longPressActivated.current = false;
        clearLongPressTimeout();
        slideAnim.stopAnimation();
        overlayOpacity.stopAnimation();
        // @ts-expect-error Animated.Value exposes __getValue at runtime
        dragStartValue.current = clamp(slideAnim.__getValue());
        if (!isOpen) {
          longPressTimeout.current = setTimeout(() => {
            if (!hasExceededDragThreshold.current) {
              longPressActivated.current = true;
              dragStartValue.current = 1;
              animateSlide(1);
            }
          }, LONG_PRESS_DURATION);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const absDy = Math.abs(gestureState.dy);
        if (!hasExceededDragThreshold.current && absDy > DRAG_ACTIVATION_THRESHOLD) {
          hasExceededDragThreshold.current = true;
          clearLongPressTimeout();
        }
        const delta = -gestureState.dy / SLIDER_HEIGHT;
        const nextValue = clamp(dragStartValue.current + delta);
        slideAnim.setValue(nextValue);
        overlayOpacity.setValue(nextValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        clearLongPressTimeout();
        setIsDragging(false);
        const delta = -gestureState.dy / SLIDER_HEIGHT;
        const nextValue = clamp(dragStartValue.current + delta);
        slideAnim.setValue(nextValue);
        overlayOpacity.setValue(nextValue);

        if (longPressActivated.current && !hasExceededDragThreshold.current) {
          animateSlide(1, false);
          longPressActivated.current = false;
          return;
        }

        if (nextValue >= 0.5) {
          animateSlide(1, !isOpen);
        } else {
          animateSlide(0, isOpen);
        }
        longPressActivated.current = false;
      },
      onPanResponderTerminate: () => {
        clearLongPressTimeout();
        setIsDragging(false);
        longPressActivated.current = false;
        animateSlide(0, false);
      },
    })
  ).current;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SLIDER_HEIGHT, 0],
  });

  return (
    <>
      <Animated.View
        pointerEvents={overlayActive || isDragging ? 'auto' : 'none'}
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => animateSlide(0)}
        />
      </Animated.View>

      <View
        style={[styles.dragHandleContainer, { backgroundColor: theme.secondaryBackground }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.dragHandle, { backgroundColor: theme.secondaryText }]} />
        <Text style={[styles.dragHandleText, { color: theme.secondaryText }]}>
          {MONTHS[currentMonth]} {currentYear}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.sliderContainer,
          { backgroundColor: theme.secondaryBackground, transform: [{ translateY }] },
        ]}
      >
        <View {...panResponder.panHandlers} style={StyleSheet.absoluteFill} />
        <View style={styles.sliderHeader}>
          <View style={[styles.sliderDragHandle, { backgroundColor: theme.secondaryText }]} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.calendarTitle, { color: theme.text }]}>
            {MONTHS[selectedMonth]} {selectedYear}
          </Text>
          
          {/* Calendar Grid */}
          <View style={styles.calendarContainer}>
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={[styles.weekdayText, { color: theme.secondaryText }]}>
                  {day}
                </Text>
              ))}
            </View>
            
            {calendarWeeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((dayData, dayIndex) => (
                  <View
                    key={dayIndex}
                    style={[
                      styles.dayCell,
                      dayData.isToday && [styles.todayCell, { backgroundColor: colors.systemBlue }],
                      dayData.isCurrentMonth &&
                        dayData.date.toDateString() === currentDate.toDateString() &&
                        [styles.selectedCell, { borderColor: colors.systemBlue }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: dayData.isCurrentMonth ? theme.text : theme.secondaryText },
                        dayData.isToday && styles.todayText,
                        !dayData.isCurrentMonth && styles.disabledDayText,
                      ]}
                    >
                      {dayData.day}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  dragHandleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    marginBottom: 8,
  },
  dragHandleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    height: SLIDER_HEIGHT,
    zIndex: 999,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  sliderHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sliderDragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  calendarContainer: {
    marginBottom: 24,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 2,
  },
  todayCell: {
    borderRadius: 8,
  },
  selectedCell: {
    borderWidth: 2,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledDayText: {
    opacity: 0.3,
  },
  quickNav: {
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  monthChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
