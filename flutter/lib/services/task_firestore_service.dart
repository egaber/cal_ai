import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/task.dart';
import 'firebase_service.dart';

/// Firestore service for Task CRUD operations.
/// 
/// Handles reading/writing tasks to Firestore following the schema:
/// /families/{familyId}/members/{userId}/tasks/{taskId}
/// 
/// Provides offline-first functionality with automatic sync.
class TaskFirestoreService {
  final FirebaseFirestore _firestore = FirebaseService.firestore;

  /// Get reference to user's tasks collection
  CollectionReference<Map<String, dynamic>> _getTasksCollection(
    String familyId,
    String userId,
  ) {
    return _firestore
        .collection('families')
        .doc(familyId)
        .collection('members')
        .doc(userId)
        .collection('tasks');
  }

  /// Stream of all tasks for a user
  Stream<List<Task>> watchTasks(String familyId, String userId) {
    return _getTasksCollection(familyId, userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Task.fromJson({...doc.data(), 'id': doc.id}))
          .toList();
    });
  }

  /// Get all tasks for a user (one-time fetch)
  Future<List<Task>> getTasks(String familyId, String userId) async {
    final snapshot = await _getTasksCollection(familyId, userId)
        .orderBy('createdAt', descending: true)
        .get();

    return snapshot.docs
        .map((doc) => Task.fromJson({...doc.data(), 'id': doc.id}))
        .toList();
  }

  /// Get a specific task
  Future<Task?> getTask(
    String familyId,
    String userId,
    String taskId,
  ) async {
    final doc =
        await _getTasksCollection(familyId, userId).doc(taskId).get();

    if (!doc.exists) return null;
    return Task.fromJson({...doc.data()!, 'id': doc.id});
  }

  /// Create a new task
  Future<String> createTask(
    String familyId,
    String userId,
    Task task,
  ) async {
    final docRef = await _getTasksCollection(familyId, userId).add(
      task.toJson()..remove('id'),
    );
    return docRef.id;
  }

  /// Update an existing task
  Future<void> updateTask(
    String familyId,
    String userId,
    String taskId,
    Task task,
  ) async {
    await _getTasksCollection(familyId, userId).doc(taskId).update(
          task.toJson()..remove('id'),
        );
  }

  /// Delete a task
  Future<void> deleteTask(
    String familyId,
    String userId,
    String taskId,
  ) async {
    await _getTasksCollection(familyId, userId).doc(taskId).delete();
  }

  /// Toggle task completion status
  Future<void> toggleTaskCompletion(
    String familyId,
    String userId,
    String taskId,
    bool isCompleted,
  ) async {
    final updates = {
      'status': isCompleted ? 'completed' : 'pending',
      'completedAt':
          isCompleted ? DateTime.now().toIso8601String() : null,
    };

    await _getTasksCollection(familyId, userId).doc(taskId).update(updates);
  }

  /// Get tasks filtered by status
  Future<List<Task>> getTasksByStatus(
    String familyId,
    String userId,
    TaskStatus status,
  ) async {
    final snapshot = await _getTasksCollection(familyId, userId)
        .where('status', isEqualTo: status.value)
        .orderBy('createdAt', descending: true)
        .get();

    return snapshot.docs
        .map((doc) => Task.fromJson({...doc.data(), 'id': doc.id}))
        .toList();
  }

  /// Get tasks with upcoming due dates
  Future<List<Task>> getUpcomingTasks(
    String familyId,
    String userId,
    DateTime before,
  ) async {
    final snapshot = await _getTasksCollection(familyId, userId)
        .where('status', isEqualTo: 'pending')
        .where('dueDate', isLessThanOrEqualTo: before.toIso8601String())
        .orderBy('dueDate')
        .get();

    return snapshot.docs
        .map((doc) => Task.fromJson({...doc.data(), 'id': doc.id}))
        .toList();
  }
}
