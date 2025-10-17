import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/calendar_event.dart';
import '../models/task.dart';
import 'task_provider.dart';

/// Provider for calendar events
final calendarEventsProvider = StateNotifierProvider<CalendarEventsNotifier, List<CalendarEvent>>((ref) {
  return CalendarEventsNotifier(ref);
});

/// Notifier for managing calendar events
class CalendarEventsNotifier extends StateNotifier<List<CalendarEvent>> {
  CalendarEventsNotifier(this.ref) : super([]) {
    _initializeEvents();
  }

  final Ref ref;

  void _initializeEvents() {
    // Listen to tasks and convert them to events
    ref.listen(taskProvider, (_, tasks) {
      _syncTasksToEvents(tasks);
    });

    // Add some sample events for demonstration
    _addSampleEvents();
  }

  void _syncTasksToEvents(List<Task> tasks) {
    // Convert tasks with due dates to calendar events
    final taskEvents = tasks
        .where((task) => task.dueDate != null && task.status != TaskStatus.completed)
        .map((task) => CalendarEvent.fromTask(
              task.id,
              task.title,
              task.dueDate!,
              task.dueTime,
            ))
        .toList();

    // Keep non-task events and add task events
    final nonTaskEvents = state.where((event) => event.type != EventType.task).toList();
    state = [...nonTaskEvents, ...taskEvents];
  }

  void _addSampleEvents() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final sampleEvents = [
      CalendarEvent(
        id: 'sample_1',
        title: 'Team Meeting',
        description: 'Weekly team sync',
        startTime: today.add(const Duration(hours: 10)),
        endTime: today.add(const Duration(hours: 11)),
        type: EventType.meeting,
        location: 'Conference Room A',
        color: '#007AFF',
      ),
      CalendarEvent(
        id: 'sample_2',
        title: 'Lunch Break',
        description: 'Time to relax',
        startTime: today.add(const Duration(hours: 13)),
        endTime: today.add(const Duration(hours: 14)),
        type: EventType.custom,
        color: '#34C759',
      ),
      CalendarEvent(
        id: 'sample_3',
        title: 'Project Review',
        description: 'Q4 project presentation',
        startTime: today.add(const Duration(days: 1, hours: 14)),
        endTime: today.add(const Duration(days: 1, hours: 15, minutes: 30)),
        type: EventType.meeting,
        location: 'Zoom',
        attendees: ['team@company.com'],
        color: '#FF9500',
      ),
      CalendarEvent(
        id: 'sample_4',
        title: 'Doctor Appointment',
        description: 'Annual checkup',
        startTime: today.add(const Duration(days: 3, hours: 9)),
        endTime: today.add(const Duration(days: 3, hours: 10)),
        type: EventType.reminder,
        location: 'Medical Center',
        color: '#FF3B30',
      ),
      CalendarEvent(
        id: 'sample_5',
        title: 'Birthday Party',
        description: "Hilly's birthday celebration",
        startTime: today.add(const Duration(days: 7)),
        endTime: today.add(const Duration(days: 7, hours: 23, minutes: 59)),
        type: EventType.birthday,
        isAllDay: true,
        color: '#AF52DE',
      ),
    ];

    state = [...state, ...sampleEvents];
  }

  void addEvent(CalendarEvent event) {
    state = [...state, event];
  }

  void updateEvent(CalendarEvent event) {
    state = [
      for (final e in state)
        if (e.id == event.id) event else e,
    ];
  }

  void deleteEvent(String eventId) {
    state = state.where((event) => event.id != eventId).toList();
  }

  List<CalendarEvent> getEventsForDate(DateTime date) {
    return state.where((event) => event.occursOnDate(date)).toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));
  }

  List<CalendarEvent> getEventsForMonth(int year, int month) {
    return state.where((event) {
      return event.startTime.year == year && event.startTime.month == month;
    }).toList();
  }
}

/// Provider for currently selected date in calendar
final selectedDateProvider = StateProvider<DateTime>((ref) {
  return DateTime.now();
});

/// Provider for current calendar view mode
enum CalendarViewMode { month, week, day }

final calendarViewModeProvider = StateProvider<CalendarViewMode>((ref) {
  return CalendarViewMode.month;
});

/// Provider for events on the currently selected date
final selectedDateEventsProvider = Provider<List<CalendarEvent>>((ref) {
  final selectedDate = ref.watch(selectedDateProvider);
  final events = ref.watch(calendarEventsProvider);
  
  return events
      .where((event) => event.occursOnDate(selectedDate))
      .toList()
    ..sort((a, b) => a.startTime.compareTo(b.startTime));
});
