import 'package:flutter/foundation.dart';

/// Event type classification
enum EventType {
  task('task', 'Task'),
  meeting('meeting', 'Meeting'),
  reminder('reminder', 'Reminder'),
  birthday('birthday', 'Birthday'),
  holiday('holiday', 'Holiday'),
  custom('custom', 'Custom');

  const EventType(this.value, this.label);
  
  final String value;
  final String label;
}

/// Calendar event model representing any scheduled item
@immutable
class CalendarEvent {
  final String id;
  final String title;
  final String? description;
  final DateTime startTime;
  final DateTime endTime;
  final EventType type;
  final String? location;
  final List<String> attendees;
  final String? color;
  final bool isAllDay;
  final String? taskId; // Reference to associated task
  final Map<String, dynamic>? metadata;

  const CalendarEvent({
    required this.id,
    required this.title,
    this.description,
    required this.startTime,
    required this.endTime,
    this.type = EventType.custom,
    this.location,
    this.attendees = const [],
    this.color,
    this.isAllDay = false,
    this.taskId,
    this.metadata,
  });

  /// Check if event occurs on a specific date
  bool occursOnDate(DateTime date) {
    final eventDate = DateTime(
      startTime.year,
      startTime.month,
      startTime.day,
    );
    final checkDate = DateTime(date.year, date.month, date.day);
    return eventDate.isAtSameMomentAs(checkDate) ||
        (startTime.isBefore(checkDate) && endTime.isAfter(checkDate));
  }

  /// Check if event is in the past
  bool get isPast => endTime.isBefore(DateTime.now());

  /// Check if event is currently happening
  bool get isOngoing {
    final now = DateTime.now();
    return startTime.isBefore(now) && endTime.isAfter(now);
  }

  /// Get duration of event
  Duration get duration => endTime.difference(startTime);

  CalendarEvent copyWith({
    String? id,
    String? title,
    String? description,
    DateTime? startTime,
    DateTime? endTime,
    EventType? type,
    String? location,
    List<String>? attendees,
    String? color,
    bool? isAllDay,
    String? taskId,
    Map<String, dynamic>? metadata,
  }) {
    return CalendarEvent(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      type: type ?? this.type,
      location: location ?? this.location,
      attendees: attendees ?? this.attendees,
      color: color ?? this.color,
      isAllDay: isAllDay ?? this.isAllDay,
      taskId: taskId ?? this.taskId,
      metadata: metadata ?? this.metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'type': type.value,
      'location': location,
      'attendees': attendees,
      'color': color,
      'isAllDay': isAllDay,
      'taskId': taskId,
      'metadata': metadata,
    };
  }

  factory CalendarEvent.fromJson(Map<String, dynamic> json) {
    return CalendarEvent(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      type: EventType.values.firstWhere(
        (e) => e.value == json['type'],
        orElse: () => EventType.custom,
      ),
      location: json['location'] as String?,
      attendees: (json['attendees'] as List<dynamic>?)?.cast<String>() ?? [],
      color: json['color'] as String?,
      isAllDay: json['isAllDay'] as bool? ?? false,
      taskId: json['taskId'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  /// Create event from Task
  factory CalendarEvent.fromTask(
    String taskId,
    String title,
    DateTime dueDate,
    DateTime? dueTime,
  ) {
    final startTime = dueTime ?? DateTime(
      dueDate.year,
      dueDate.month,
      dueDate.day,
      9,
      0,
    );
    final endTime = dueTime?.add(const Duration(hours: 1)) ?? DateTime(
      dueDate.year,
      dueDate.month,
      dueDate.day,
      10,
      0,
    );

    return CalendarEvent(
      id: 'task_$taskId',
      title: title,
      startTime: startTime,
      endTime: endTime,
      type: EventType.task,
      taskId: taskId,
      isAllDay: dueTime == null,
    );
  }
}
