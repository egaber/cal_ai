import 'package:intl/intl.dart';
import '../models/task.dart';

/// Result of parsing task input text
class ParsedTaskData {
  final String cleanTitle;
  final DateTime? dueDate;
  final DateTime? dueTime;
  final String? location;
  final TaskPriority priority;
  final List<String> tags;

  const ParsedTaskData({
    required this.cleanTitle,
    this.dueDate,
    this.dueTime,
    this.location,
    this.priority = TaskPriority.none,
    this.tags = const [],
  });
}

/// Service for parsing natural language task input
/// Supports both English and Hebrew
class TaskParserService {
  // English patterns
  static final _priorityPatternEn = RegExp(r'\b[Pp][123]\b');
  static final _locationPatternEn = RegExp(r'@(\w+(?:\s+\w+)*)');
  static final _tagPatternEn = RegExp(r'#(\w+)');
  
  // Hebrew patterns
  static final _priorityPatternHe = RegExp(r'\bעדיפות\s*([123])\b');
  static final _locationPatternHe = RegExp(r'ב([א-ת\s]+)(?=\s|$)');
  
  // Date patterns - English
  static final _todayPatternEn = RegExp(r'\b(today|היום)\b', caseSensitive: false);
  static final _tomorrowPatternEn = RegExp(r'\b(tomorrow|מחר)\b', caseSensitive: false);
  static final _nextWeekPatternEn = RegExp(r'\b(next week|שבוע הבא)\b', caseSensitive: false);
  
  // Time patterns - supports both 12h and 24h formats
  static final _timePattern = RegExp(
    r'\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?\b|'
    r'\b(\d{1,2})\s*(am|pm|AM|PM)\b'
  );
  
  // Specific date patterns (dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd)
  static final _datePattern = RegExp(
    r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b|'
    r'\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b'
  );
  
  // Day names in English and Hebrew
  static final _dayNamesEn = {
    'monday': DateTime.monday,
    'tuesday': DateTime.tuesday,
    'wednesday': DateTime.wednesday,
    'thursday': DateTime.thursday,
    'friday': DateTime.friday,
    'saturday': DateTime.saturday,
    'sunday': DateTime.sunday,
  };
  
  static final _dayNamesHe = {
    'ראשון': DateTime.sunday,
    'שני': DateTime.monday,
    'שלישי': DateTime.tuesday,
    'רביעי': DateTime.wednesday,
    'חמישי': DateTime.thursday,
    'שישי': DateTime.friday,
    'שבת': DateTime.saturday,
  };

  /// Parse task input text and extract structured data
  ParsedTaskData parseTaskInput(String input) {
    String cleanTitle = input;
    DateTime? dueDate;
    DateTime? dueTime;
    String? location;
    TaskPriority priority = TaskPriority.none;
    List<String> tags = [];

    // Extract priority (P1, P2, P3)
    final priorityMatch = _priorityPatternEn.firstMatch(input);
    if (priorityMatch != null) {
      final priorityText = priorityMatch.group(0)!.toUpperCase();
      switch (priorityText) {
        case 'P1':
          priority = TaskPriority.p1;
          break;
        case 'P2':
          priority = TaskPriority.p2;
          break;
        case 'P3':
          priority = TaskPriority.p3;
          break;
      }
      cleanTitle = cleanTitle.replaceAll(priorityMatch.group(0)!, '').trim();
    }

    // Hebrew priority pattern
    final priorityMatchHe = _priorityPatternHe.firstMatch(input);
    if (priorityMatchHe != null) {
      final priorityNum = priorityMatchHe.group(1);
      switch (priorityNum) {
        case '1':
          priority = TaskPriority.p1;
          break;
        case '2':
          priority = TaskPriority.p2;
          break;
        case '3':
          priority = TaskPriority.p3;
          break;
      }
      cleanTitle = cleanTitle.replaceAll(priorityMatchHe.group(0)!, '').trim();
    }

    // Extract location (@location)
    final locationMatch = _locationPatternEn.firstMatch(input);
    if (locationMatch != null) {
      location = locationMatch.group(1);
      cleanTitle = cleanTitle.replaceAll(locationMatch.group(0)!, '').trim();
    }

    // Extract tags (#tag)
    final tagMatches = _tagPatternEn.allMatches(input);
    for (final match in tagMatches) {
      tags.add(match.group(1)!);
      cleanTitle = cleanTitle.replaceAll(match.group(0)!, '').trim();
    }

    // Extract time
    final timeMatch = _timePattern.firstMatch(input);
    if (timeMatch != null) {
      dueTime = _parseTime(timeMatch);
      cleanTitle = cleanTitle.replaceAll(timeMatch.group(0)!, '').trim();
    }

    // Extract date
    dueDate = _parseDate(input);
    if (dueDate != null) {
      // Remove the matched date pattern from title
      if (_todayPatternEn.hasMatch(input)) {
        cleanTitle = cleanTitle.replaceAll(_todayPatternEn, '').trim();
      } else if (_tomorrowPatternEn.hasMatch(input)) {
        cleanTitle = cleanTitle.replaceAll(_tomorrowPatternEn, '').trim();
      } else if (_nextWeekPatternEn.hasMatch(input)) {
        cleanTitle = cleanTitle.replaceAll(_nextWeekPatternEn, '').trim();
      } else if (_datePattern.hasMatch(input)) {
        cleanTitle = cleanTitle.replaceAll(_datePattern, '').trim();
      }
      
      // Check for day names
      for (final dayName in _dayNamesEn.keys) {
        if (input.toLowerCase().contains(dayName)) {
          cleanTitle = cleanTitle.replaceAll(RegExp(dayName, caseSensitive: false), '').trim();
          break;
        }
      }
      
      for (final dayName in _dayNamesHe.keys) {
        if (input.contains(dayName)) {
          cleanTitle = cleanTitle.replaceAll(dayName, '').trim();
          break;
        }
      }
    }

    // Clean up multiple spaces
    cleanTitle = cleanTitle.replaceAll(RegExp(r'\s+'), ' ').trim();

    return ParsedTaskData(
      cleanTitle: cleanTitle,
      dueDate: dueDate,
      dueTime: dueTime,
      location: location,
      priority: priority,
      tags: tags,
    );
  }

  /// Parse date from input text
  DateTime? _parseDate(String input) {
    final now = DateTime.now();
    final inputLower = input.toLowerCase();

    // Today
    if (_todayPatternEn.hasMatch(input)) {
      return DateTime(now.year, now.month, now.day);
    }

    // Tomorrow
    if (_tomorrowPatternEn.hasMatch(input)) {
      final tomorrow = now.add(const Duration(days: 1));
      return DateTime(tomorrow.year, tomorrow.month, tomorrow.day);
    }

    // Next week
    if (_nextWeekPatternEn.hasMatch(input)) {
      final nextWeek = now.add(const Duration(days: 7));
      return DateTime(nextWeek.year, nextWeek.month, nextWeek.day);
    }

    // Specific date (dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd)
    final dateMatch = _datePattern.firstMatch(input);
    if (dateMatch != null) {
      try {
        if (dateMatch.group(1) != null) {
          // dd/mm/yyyy or dd-mm-yyyy format
          final day = int.parse(dateMatch.group(1)!);
          final month = int.parse(dateMatch.group(2)!);
          final year = int.parse(dateMatch.group(3)!);
          return DateTime(year, month, day);
        } else if (dateMatch.group(4) != null) {
          // yyyy-mm-dd format
          final year = int.parse(dateMatch.group(4)!);
          final month = int.parse(dateMatch.group(5)!);
          final day = int.parse(dateMatch.group(6)!);
          return DateTime(year, month, day);
        }
      } catch (e) {
        // Invalid date, return null
        return null;
      }
    }

    // Day names - English
    for (final entry in _dayNamesEn.entries) {
      if (inputLower.contains(entry.key)) {
        return _getNextWeekday(now, entry.value);
      }
    }

    // Day names - Hebrew
    for (final entry in _dayNamesHe.entries) {
      if (input.contains(entry.key)) {
        return _getNextWeekday(now, entry.value);
      }
    }

    return null;
  }

  /// Get the next occurrence of a specific weekday
  DateTime _getNextWeekday(DateTime from, int targetWeekday) {
    final currentWeekday = from.weekday;
    int daysToAdd;
    
    if (currentWeekday < targetWeekday) {
      daysToAdd = targetWeekday - currentWeekday;
    } else {
      daysToAdd = 7 - currentWeekday + targetWeekday;
    }
    
    final targetDate = from.add(Duration(days: daysToAdd));
    return DateTime(targetDate.year, targetDate.month, targetDate.day);
  }

  /// Parse time from regex match
  DateTime? _parseTime(RegExpMatch match) {
    try {
      final now = DateTime.now();
      
      // Format: HH:MM AM/PM or HH AM/PM
      if (match.group(1) != null && match.group(2) != null) {
        // HH:MM format
        int hour = int.parse(match.group(1)!);
        final minute = int.parse(match.group(2)!);
        final period = match.group(3)?.toUpperCase();
        
        if (period == 'PM' && hour != 12) {
          hour += 12;
        } else if (period == 'AM' && hour == 12) {
          hour = 0;
        }
        
        return DateTime(now.year, now.month, now.day, hour, minute);
      } else if (match.group(4) != null) {
        // H AM/PM format
        int hour = int.parse(match.group(4)!);
        final period = match.group(5)?.toUpperCase();
        
        if (period == 'PM' && hour != 12) {
          hour += 12;
        } else if (period == 'AM' && hour == 12) {
          hour = 0;
        }
        
        return DateTime(now.year, now.month, now.day, hour, 0);
      }
    } catch (e) {
      return null;
    }
    
    return null;
  }

  /// Get formatted date string for display
  String formatDate(DateTime? date) {
    if (date == null) return '';
    
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));
    final dateOnly = DateTime(date.year, date.month, date.day);
    
    if (dateOnly == today) {
      return 'Today';
    } else if (dateOnly == tomorrow) {
      return 'Tomorrow';
    } else if (dateOnly.difference(today).inDays < 7 && dateOnly.isAfter(today)) {
      return DateFormat('EEEE').format(date);
    } else {
      return DateFormat('MMM d, yyyy').format(date);
    }
  }

  /// Get formatted time string for display
  String formatTime(DateTime? time) {
    if (time == null) return '';
    return DateFormat('h:mm a').format(time);
  }
}
