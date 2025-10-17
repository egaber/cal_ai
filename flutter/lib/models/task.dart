import 'package:flutter/foundation.dart';

/// Priority levels for tasks
enum TaskPriority {
  p1('P1', 'High Priority', 1),
  p2('P2', 'Medium Priority', 2),
  p3('P3', 'Low Priority', 3),
  none('None', 'No Priority', 4);

  const TaskPriority(this.label, this.description, this.value);
  
  final String label;
  final String description;
  final int value;
}

/// Recurrence pattern for repeating tasks
enum RecurrencePattern {
  none('None', 'Does not repeat'),
  daily('Daily', 'Every day'),
  weekdays('Weekdays', 'Monday to Friday'),
  weekly('Weekly', 'Every week'),
  biweekly('Biweekly', 'Every 2 weeks'),
  monthly('Monthly', 'Every month'),
  yearly('Yearly', 'Every year'),
  custom('Custom', 'Custom pattern');

  const RecurrencePattern(this.label, this.description);
  
  final String label;
  final String description;
}

/// Task status
enum TaskStatus {
  pending('pending'),
  completed('completed'),
  cancelled('cancelled');

  const TaskStatus(this.value);
  
  final String value;
}

/// Represents a reminder for a task
@immutable
class TaskReminder {
  final String id;
  final DateTime dateTime;
  final String message;
  final bool isActive;

  const TaskReminder({
    required this.id,
    required this.dateTime,
    required this.message,
    this.isActive = true,
  });

  TaskReminder copyWith({
    String? id,
    DateTime? dateTime,
    String? message,
    bool? isActive,
  }) {
    return TaskReminder(
      id: id ?? this.id,
      dateTime: dateTime ?? this.dateTime,
      message: message ?? this.message,
      isActive: isActive ?? this.isActive,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'dateTime': dateTime.toIso8601String(),
      'message': message,
      'isActive': isActive,
    };
  }

  factory TaskReminder.fromJson(Map<String, dynamic> json) {
    return TaskReminder(
      id: json['id'] as String,
      dateTime: DateTime.parse(json['dateTime'] as String),
      message: json['message'] as String,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}

/// Represents a subtask within a main task
@immutable
class Subtask {
  final String id;
  final String title;
  final bool isCompleted;
  final DateTime createdAt;

  const Subtask({
    required this.id,
    required this.title,
    this.isCompleted = false,
    required this.createdAt,
  });

  Subtask copyWith({
    String? id,
    String? title,
    bool? isCompleted,
    DateTime? createdAt,
  }) {
    return Subtask(
      id: id ?? this.id,
      title: title ?? this.title,
      isCompleted: isCompleted ?? this.isCompleted,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'isCompleted': isCompleted,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory Subtask.fromJson(Map<String, dynamic> json) {
    return Subtask(
      id: json['id'] as String,
      title: json['title'] as String,
      isCompleted: json['isCompleted'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

/// Main Task model
@immutable
class Task {
  final String id;
  final String title;
  final String? description;
  final TaskStatus status;
  final TaskPriority priority;
  final DateTime createdAt;
  final DateTime? dueDate;
  final DateTime? dueTime;
  final String? location;
  final List<Subtask> subtasks;
  final List<TaskReminder> reminders;
  final RecurrencePattern recurrence;
  final String? recurrenceEndDate;
  final List<String> tags;
  final String? assignedTo;
  final DateTime? completedAt;

  const Task({
    required this.id,
    required this.title,
    this.description,
    this.status = TaskStatus.pending,
    this.priority = TaskPriority.none,
    required this.createdAt,
    this.dueDate,
    this.dueTime,
    this.location,
    this.subtasks = const [],
    this.reminders = const [],
    this.recurrence = RecurrencePattern.none,
    this.recurrenceEndDate,
    this.tags = const [],
    this.assignedTo,
    this.completedAt,
  });

  Task copyWith({
    String? id,
    String? title,
    String? description,
    TaskStatus? status,
    TaskPriority? priority,
    DateTime? createdAt,
    DateTime? dueDate,
    DateTime? dueTime,
    String? location,
    List<Subtask>? subtasks,
    List<TaskReminder>? reminders,
    RecurrencePattern? recurrence,
    String? recurrenceEndDate,
    List<String>? tags,
    String? assignedTo,
    DateTime? completedAt,
  }) {
    return Task(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      createdAt: createdAt ?? this.createdAt,
      dueDate: dueDate ?? this.dueDate,
      dueTime: dueTime ?? this.dueTime,
      location: location ?? this.location,
      subtasks: subtasks ?? this.subtasks,
      reminders: reminders ?? this.reminders,
      recurrence: recurrence ?? this.recurrence,
      recurrenceEndDate: recurrenceEndDate ?? this.recurrenceEndDate,
      tags: tags ?? this.tags,
      assignedTo: assignedTo ?? this.assignedTo,
      completedAt: completedAt ?? this.completedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'status': status.value,
      'priority': priority.label,
      'createdAt': createdAt.toIso8601String(),
      'dueDate': dueDate?.toIso8601String(),
      'dueTime': dueTime?.toIso8601String(),
      'location': location,
      'subtasks': subtasks.map((s) => s.toJson()).toList(),
      'reminders': reminders.map((r) => r.toJson()).toList(),
      'recurrence': recurrence.label,
      'recurrenceEndDate': recurrenceEndDate,
      'tags': tags,
      'assignedTo': assignedTo,
      'completedAt': completedAt?.toIso8601String(),
    };
  }

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      status: TaskStatus.values.firstWhere(
        (e) => e.value == json['status'],
        orElse: () => TaskStatus.pending,
      ),
      priority: TaskPriority.values.firstWhere(
        (e) => e.label == json['priority'],
        orElse: () => TaskPriority.none,
      ),
      createdAt: DateTime.parse(json['createdAt'] as String),
      dueDate: json['dueDate'] != null 
          ? DateTime.parse(json['dueDate'] as String) 
          : null,
      dueTime: json['dueTime'] != null 
          ? DateTime.parse(json['dueTime'] as String) 
          : null,
      location: json['location'] as String?,
      subtasks: (json['subtasks'] as List<dynamic>?)
          ?.map((s) => Subtask.fromJson(s as Map<String, dynamic>))
          .toList() ?? [],
      reminders: (json['reminders'] as List<dynamic>?)
          ?.map((r) => TaskReminder.fromJson(r as Map<String, dynamic>))
          .toList() ?? [],
      recurrence: RecurrencePattern.values.firstWhere(
        (e) => e.label == json['recurrence'],
        orElse: () => RecurrencePattern.none,
      ),
      recurrenceEndDate: json['recurrenceEndDate'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
      assignedTo: json['assignedTo'] as String?,
      completedAt: json['completedAt'] != null 
          ? DateTime.parse(json['completedAt'] as String) 
          : null,
    );
  }
}
