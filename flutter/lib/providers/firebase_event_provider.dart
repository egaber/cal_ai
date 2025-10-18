import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/calendar_event.dart';
import '../services/firebase_service.dart';
import '../services/event_firestore_service.dart';
import 'firebase_task_provider.dart';

/// Provider for EventFirestoreService
final eventFirestoreServiceProvider = Provider<EventFirestoreService>((ref) {
  return EventFirestoreService();
});

/// Provider for current calendar source (local or google)
final currentCalendarSourceProvider = StateProvider<String>((ref) => 'local');

/// Provider for events stream from Firebase
/// 
/// Automatically syncs with Firestore when family ID, user ID, and calendar source are available.
/// Returns empty list if user is not authenticated or family not selected.
final firebaseEventsProvider = StreamProvider<List<CalendarEvent>>((ref) {
  final eventService = ref.watch(eventFirestoreServiceProvider);
  final familyId = ref.watch(currentFamilyIdProvider);
  final userId = ref.watch(currentUserIdProvider);
  final calendarSource = ref.watch(currentCalendarSourceProvider);

  if (familyId == null || userId == null) {
    return Stream.value([]);
  }

  return eventService.watchEvents(familyId, userId, calendarSource);
});

/// Provider for all events from all calendar sources
final allFirebaseEventsProvider = FutureProvider<List<CalendarEvent>>((ref) async {
  final eventService = ref.watch(eventFirestoreServiceProvider);
  final familyId = ref.watch(currentFamilyIdProvider);
  final userId = ref.watch(currentUserIdProvider);

  if (familyId == null || userId == null) {
    return [];
  }

  return await eventService.getAllEvents(familyId, userId);
});

/// Provider for events on a specific date
final eventsForDateProvider = FutureProviderFamily<List<CalendarEvent>, DateTime>(
  (ref, date) async {
    final eventService = ref.watch(eventFirestoreServiceProvider);
    final familyId = ref.watch(currentFamilyIdProvider);
    final userId = ref.watch(currentUserIdProvider);

    if (familyId == null || userId == null) {
      return [];
    }

    return await eventService.getEventsForDate(familyId, userId, date);
  },
);

/// Provider for event operations
/// 
/// Provides methods to create, update, delete events in Firestore.
class FirebaseEventNotifier extends StateNotifier<AsyncValue<List<CalendarEvent>>> {
  FirebaseEventNotifier(this.ref) : super(const AsyncValue.loading());

  final Ref ref;

  EventFirestoreService get _service =>
      ref.read(eventFirestoreServiceProvider);
  String? get _familyId => ref.read(currentFamilyIdProvider);
  String? get _userId => ref.read(currentUserIdProvider);
  String get _calendarSource => ref.read(currentCalendarSourceProvider);

  /// Add a new event
  Future<void> addEvent(CalendarEvent event) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      throw Exception('User not authenticated or family not selected');
    }

    await _service.createEvent(familyId, userId, _calendarSource, event);
  }

  /// Update an existing event
  Future<void> updateEvent(CalendarEvent event) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      throw Exception('User not authenticated or family not selected');
    }

    await _service.updateEvent(
      familyId,
      userId,
      _calendarSource,
      event.id,
      event,
    );
  }

  /// Delete an event
  Future<void> deleteEvent(String eventId) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      throw Exception('User not authenticated or family not selected');
    }

    await _service.deleteEvent(familyId, userId, _calendarSource, eventId);
  }

  /// Get events for a date range
  Future<List<CalendarEvent>> getEventsByDateRange(
    DateTime start,
    DateTime end,
  ) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      return [];
    }

    return await _service.getEventsByDateRange(
      familyId,
      userId,
      _calendarSource,
      start,
      end,
    );
  }

  /// Get events for a specific date
  Future<List<CalendarEvent>> getEventsForDate(DateTime date) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      return [];
    }

    return await _service.getEventsForDate(familyId, userId, date);
  }
}

/// Provider for Firebase event operations
final firebaseEventNotifierProvider =
    StateNotifierProvider<FirebaseEventNotifier, AsyncValue<List<CalendarEvent>>>(
  (ref) {
    return FirebaseEventNotifier(ref);
  },
);
