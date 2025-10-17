import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/task.dart';

/// State notifier for managing tasks
class TaskNotifier extends StateNotifier<List<Task>> {
  TaskNotifier() : super([]);

  /// Add a new task
  void addTask(Task task) {
    state = [...state, task];
  }

  /// Update an existing task
  void updateTask(Task updatedTask) {
    state = [
      for (final task in state)
        if (task.id == updatedTask.id) updatedTask else task,
    ];
  }

  /// Delete a task
  void deleteTask(String taskId) {
    state = state.where((task) => task.id != taskId).toList();
  }

  /// Toggle task completion status
  void toggleTaskCompletion(String taskId) {
    state = [
      for (final task in state)
        if (task.id == taskId)
          task.copyWith(
            status: task.status == TaskStatus.completed
                ? TaskStatus.pending
                : TaskStatus.completed,
            completedAt: task.status == TaskStatus.completed
                ? null
                : DateTime.now(),
          )
        else
          task,
    ];
  }

  /// Get pending tasks
  List<Task> get pendingTasks {
    return state.where((task) => task.status == TaskStatus.pending).toList()
      ..sort((a, b) {
        // Sort by priority first (P1 > P2 > P3 > None)
        if (a.priority.value != b.priority.value) {
          return a.priority.value.compareTo(b.priority.value);
        }
        // Then by due date
        if (a.dueDate != null && b.dueDate == null) return -1;
        if (a.dueDate == null && b.dueDate != null) return 1;
        if (a.dueDate != null && b.dueDate != null) {
          return a.dueDate!.compareTo(b.dueDate!);
        }
        // Finally by creation date
        return b.createdAt.compareTo(a.createdAt);
      });
  }

  /// Get completed tasks
  List<Task> get completedTasks {
    return state.where((task) => task.status == TaskStatus.completed).toList()
      ..sort((a, b) => (b.completedAt ?? b.createdAt)
          .compareTo(a.completedAt ?? a.createdAt));
  }
}

/// Provider for task list management
final taskProvider = StateNotifierProvider<TaskNotifier, List<Task>>((ref) {
  return TaskNotifier();
});

/// Provider for pending tasks
final pendingTasksProvider = Provider<List<Task>>((ref) {
  final taskNotifier = ref.watch(taskProvider.notifier);
  return taskNotifier.pendingTasks;
});

/// Provider for completed tasks
final completedTasksProvider = Provider<List<Task>>((ref) {
  final taskNotifier = ref.watch(taskProvider.notifier);
  return taskNotifier.completedTasks;
});
