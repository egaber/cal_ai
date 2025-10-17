import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/task.dart';
import '../providers/task_provider.dart';
import '../services/task_parser_service.dart';
import 'task_creation_sheet.dart';

/// A single task item in the list
/// 
/// Features:
/// - Circular checkbox for completion
/// - Task title
/// - Due date/time badge with color coding
/// - Priority indicator
/// - Location display
/// - Tap to edit task details
class TaskItem extends ConsumerWidget {
  final Task task;

  const TaskItem({
    super.key,
    required this.task,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () => _editTask(context, ref),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: CupertinoColors.systemBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: CupertinoColors.separator.resolveFrom(context),
          ),
        ),
        child: Row(
          children: [
            // Circular checkbox
            _buildCheckbox(ref),
            
            const SizedBox(width: 12),
            
            // Task content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title with priority indicator
                  Row(
                    children: [
                      if (task.priority != TaskPriority.none) ...[
                        _buildPriorityIndicator(),
                        const SizedBox(width: 6),
                      ],
                      Expanded(
                        child: Text(
                          task.title,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            decoration: task.status == TaskStatus.completed
                                ? TextDecoration.lineThrough
                                : null,
                            color: task.status == TaskStatus.completed
                                ? CupertinoColors.systemGrey
                                : CupertinoColors.label.resolveFrom(context),
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 4),
                  
                  // Metadata row (date, time, location)
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      if (task.dueDate != null) _buildDateBadge(),
                      if (task.dueTime != null) _buildTimeBadge(),
                      if (task.location != null) _buildLocationBadge(),
                      if (task.recurrence != RecurrencePattern.none)
                        _buildRecurrenceBadge(),
                      if (task.reminders.isNotEmpty) _buildReminderBadge(),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(width: 8),
            
            // Chevron icon
            const Icon(
              CupertinoIcons.chevron_right,
              size: 16,
              color: CupertinoColors.systemGrey,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckbox(WidgetRef ref) {
    final isCompleted = task.status == TaskStatus.completed;
    
    return GestureDetector(
      onTap: () {
        ref.read(taskProvider.notifier).toggleTaskCompletion(task.id);
      },
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: isCompleted
                ? CupertinoColors.systemGreen
                : CupertinoColors.systemGrey3,
            width: 2,
          ),
          color: isCompleted
              ? CupertinoColors.systemGreen
              : CupertinoColors.systemBackground,
        ),
        child: isCompleted
            ? const Icon(
                CupertinoIcons.check_mark,
                size: 16,
                color: CupertinoColors.white,
              )
            : null,
      ),
    );
  }

  Widget _buildPriorityIndicator() {
    Color color;
    switch (task.priority) {
      case TaskPriority.p1:
        color = CupertinoColors.systemRed;
        break;
      case TaskPriority.p2:
        color = CupertinoColors.systemOrange;
        break;
      case TaskPriority.p3:
        color = CupertinoColors.systemYellow;
        break;
      case TaskPriority.none:
        color = CupertinoColors.systemGrey;
        break;
    }
    
    return Icon(
      CupertinoIcons.flag_fill,
      size: 14,
      color: color,
    );
  }

  Widget _buildDateBadge() {
    final parser = TaskParserService();
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dueDate = DateTime(
      task.dueDate!.year,
      task.dueDate!.month,
      task.dueDate!.day,
    );
    
    Color color;
    if (dueDate.isBefore(today)) {
      color = CupertinoColors.systemRed;
    } else if (dueDate == today) {
      color = CupertinoColors.systemOrange;
    } else if (dueDate.difference(today).inDays <= 3) {
      color = CupertinoColors.systemYellow;
    } else {
      color = CupertinoColors.systemBlue;
    }
    
    return _buildBadge(
      icon: CupertinoIcons.calendar,
      label: parser.formatDate(task.dueDate),
      color: color,
    );
  }

  Widget _buildTimeBadge() {
    final parser = TaskParserService();
    return _buildBadge(
      icon: CupertinoIcons.time,
      label: parser.formatTime(task.dueTime),
      color: CupertinoColors.systemGreen,
    );
  }

  Widget _buildLocationBadge() {
    return _buildBadge(
      icon: CupertinoIcons.location_fill,
      label: task.location!,
      color: CupertinoColors.systemIndigo,
    );
  }

  Widget _buildRecurrenceBadge() {
    return _buildBadge(
      icon: CupertinoIcons.repeat,
      label: task.recurrence.label,
      color: CupertinoColors.systemPurple,
    );
  }

  Widget _buildReminderBadge() {
    return _buildBadge(
      icon: CupertinoIcons.bell_fill,
      label: '${task.reminders.length}',
      color: CupertinoColors.systemTeal,
    );
  }

  Widget _buildBadge({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _editTask(BuildContext context, WidgetRef ref) async {
    final result = await showCupertinoModalPopup<Task>(
      context: context,
      builder: (context) => TaskCreationSheet(existingTask: task),
    );
    
    if (result != null) {
      ref.read(taskProvider.notifier).updateTask(result);
    }
  }
}
