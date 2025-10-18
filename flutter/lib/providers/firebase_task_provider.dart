import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/task.dart';
import '../services/firebase_service.dart';
import '../services/task_firestore_service.dart';

/// Provider for TaskFirestoreService
final taskFirestoreServiceProvider = Provider<TaskFirestoreService>((ref) {
  return TaskFirestoreService();
});

/// Provider for current family ID
/// Dynamically set by AuthProvider when user signs in
final currentFamilyIdProvider = StateProvider<String?>((ref) => null);

/// Provider for current user ID (from Firebase Auth)
final currentUserIdProvider = Provider<String?>((ref) {
  return FirebaseService.currentUserId;
});

/// Provider for tasks stream from Firebase
/// 
/// Automatically syncs with Firestore when family ID and user ID are available.
/// Returns empty list if user is not authenticated or family not selected.
final firebaseTasksProvider = StreamProvider<List<Task>>((ref) {
  final taskService = ref.watch(taskFirestoreServiceProvider);
  final familyId = ref.watch(currentFamilyIdProvider);
  final userId = ref.watch(currentUserIdProvider);

  if (familyId == null || userId == null) {
    return Stream.value([]);
  }

  return taskService.watchTasks(familyId, userId);
});

/// Provider for task operations
/// 
/// Provides methods to create, update, delete tasks in Firestore.
class FirebaseTaskNotifier extends StateNotifier<AsyncValue<List<Task>>> {
  FirebaseTaskNotifier(this.ref) : super(const AsyncValue.loading());

  final Ref ref;

  TaskFirestoreService get _service =>
      ref.read(taskFirestoreServiceProvider);
  String? get _familyId => ref.read(currentFamilyIdProvider);
  String? get _userId => ref.read(currentUserIdProvider);

  /// Add a new task
  Future<void> addTask(Task task) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      throw Exception('User not authenticated or family not selected');
    }

    await _service.createTask(familyId, userId, task);
  }

  /// Update an existing task
  Future<void> updateTask(Task task) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      throw Exception('User not authenticated or family not selected');
    }

    await _service.updateTask(familyId, userId, task.id, task);
  }

  /// Delete a task
  Future<void> deleteTask(String taskId) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      throw Exception('User not authenticated or family not selected');
    }

    await _service.deleteTask(familyId, userId, taskId);
  }

  /// Toggle task completion
  Future<void> toggleCompletion(String taskId, bool isCompleted) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      throw Exception('User not authenticated or family not selected');
    }

    await _service.toggleTaskCompletion(
      familyId,
      userId,
      taskId,
      isCompleted,
    );
  }

  /// Get tasks by status
  Future<List<Task>> getTasksByStatus(TaskStatus status) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      return [];
    }

    return await _service.getTasksByStatus(familyId, userId, status);
  }

  /// Get upcoming tasks
  Future<List<Task>> getUpcomingTasks(DateTime before) async {
    final familyId = _familyId;
    final userId = _userId;

    if (familyId == null || userId == null) {
      return [];
    }

    return await _service.getUpcomingTasks(familyId, userId, before);
  }
}

/// Provider for Firebase task operations
final firebaseTaskNotifierProvider =
    StateNotifierProvider<FirebaseTaskNotifier, AsyncValue<List<Task>>>((ref) {
  return FirebaseTaskNotifier(ref);
});
