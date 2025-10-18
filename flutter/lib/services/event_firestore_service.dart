import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/calendar_event.dart';
import 'firebase_service.dart';

/// Firestore service for CalendarEvent CRUD operations.
/// 
/// Handles reading/writing events to Firestore following the schema:
/// /families/{familyId}/members/{userId}/calendars/{source}/events/{eventId}
/// 
/// Supports multiple calendar sources (local, google) per user.
class EventFirestoreService {
  final FirebaseFirestore _firestore = FirebaseService.firestore;

  /// Get reference to user's events collection for a specific calendar source
  CollectionReference<Map<String, dynamic>> _getEventsCollection(
    String familyId,
    String userId,
    String calendarSource,
  ) {
    return _firestore
        .collection('families')
        .doc(familyId)
        .collection('members')
        .doc(userId)
        .collection('calendars')
        .doc(calendarSource)
        .collection('events');
  }

  /// Stream of all events for a user from a specific calendar source
  Stream<List<CalendarEvent>> watchEvents(
    String familyId,
    String userId,
    String calendarSource,
  ) {
    return _getEventsCollection(familyId, userId, calendarSource)
        .orderBy('startTime')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) =>
              CalendarEvent.fromJson({...doc.data(), 'id': doc.id}))
          .toList();
    });
  }

  /// Get events for a specific date range
  Future<List<CalendarEvent>> getEventsByDateRange(
    String familyId,
    String userId,
    String calendarSource,
    DateTime start,
    DateTime end,
  ) async {
    final snapshot = await _getEventsCollection(
      familyId,
      userId,
      calendarSource,
    )
        .where('startTime',
            isGreaterThanOrEqualTo: start.toIso8601String())
        .where('startTime', isLessThan: end.toIso8601String())
        .orderBy('startTime')
        .get();

    return snapshot.docs
        .map((doc) =>
            CalendarEvent.fromJson({...doc.data(), 'id': doc.id}))
        .toList();
  }

  /// Get all events from all calendar sources for a user
  Future<List<CalendarEvent>> getAllEvents(
    String familyId,
    String userId,
  ) async {
    final calendarsSnapshot = await _firestore
        .collection('families')
        .doc(familyId)
        .collection('members')
        .doc(userId)
        .collection('calendars')
        .get();

    final allEvents = <CalendarEvent>[];

    for (final calendarDoc in calendarsSnapshot.docs) {
      final eventsSnapshot =
          await calendarDoc.reference.collection('events').get();

      final events = eventsSnapshot.docs
          .map((doc) =>
              CalendarEvent.fromJson({...doc.data(), 'id': doc.id}))
          .toList();

      allEvents.addAll(events);
    }

    // Sort by start time
    allEvents.sort((a, b) => a.startTime.compareTo(b.startTime));
    return allEvents;
  }

  /// Get a specific event
  Future<CalendarEvent?> getEvent(
    String familyId,
    String userId,
    String calendarSource,
    String eventId,
  ) async {
    final doc = await _getEventsCollection(
      familyId,
      userId,
      calendarSource,
    ).doc(eventId).get();

    if (!doc.exists) return null;
    return CalendarEvent.fromJson({...doc.data()!, 'id': doc.id});
  }

  /// Create a new event
  Future<String> createEvent(
    String familyId,
    String userId,
    String calendarSource,
    CalendarEvent event,
  ) async {
    final docRef = await _getEventsCollection(
      familyId,
      userId,
      calendarSource,
    ).add(event.toJson()..remove('id'));
    
    return docRef.id;
  }

  /// Update an existing event
  Future<void> updateEvent(
    String familyId,
    String userId,
    String calendarSource,
    String eventId,
    CalendarEvent event,
  ) async {
    await _getEventsCollection(familyId, userId, calendarSource)
        .doc(eventId)
        .update(event.toJson()..remove('id'));
  }

  /// Delete an event
  Future<void> deleteEvent(
    String familyId,
    String userId,
    String calendarSource,
    String eventId,
  ) async {
    await _getEventsCollection(familyId, userId, calendarSource)
        .doc(eventId)
        .delete();
  }

  /// Get events for a specific date
  Future<List<CalendarEvent>> getEventsForDate(
    String familyId,
    String userId,
    DateTime date,
  ) async {
    final startOfDay = DateTime(date.year, date.month, date.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));

    // Get events from all calendar sources
    final calendarsSnapshot = await _firestore
        .collection('families')
        .doc(familyId)
        .collection('members')
        .doc(userId)
        .collection('calendars')
        .get();

    final allEvents = <CalendarEvent>[];

    for (final calendarDoc in calendarsSnapshot.docs) {
      final eventsSnapshot = await calendarDoc.reference
          .collection('events')
          .where('startTime',
              isGreaterThanOrEqualTo: startOfDay.toIso8601String())
          .where('startTime',
              isLessThan: endOfDay.toIso8601String())
          .get();

      final events = eventsSnapshot.docs
          .map((doc) =>
              CalendarEvent.fromJson({...doc.data(), 'id': doc.id}))
          .toList();

      allEvents.addAll(events);
    }

    // Sort by start time
    allEvents.sort((a, b) => a.startTime.compareTo(b.startTime));
    return allEvents;
  }
}
