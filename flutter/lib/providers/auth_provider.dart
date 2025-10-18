import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import '../services/firebase_service.dart';
import '../services/family_service.dart';
import 'firebase_task_provider.dart';

/// Provider for AuthService
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

/// Provider for FamilyService
final familyServiceProvider = Provider<FamilyService>((ref) {
  return FamilyService();
});

/// Provider for Firebase Auth state changes
/// Returns null stream if Firebase not initialized yet
final authStateProvider = StreamProvider<User?>((ref) {
  try {
    return FirebaseService.auth.authStateChanges();
  } catch (e) {
    print('Firebase not initialized yet, returning empty stream');
    return Stream.value(null);
  }
});

/// Provider for current user profile
final userProfileProvider = StreamProvider<UserProfile?>((ref) async* {
  final authState = ref.watch(authStateProvider);
  
  await for (final user in Stream.value(authState.value)) {
    if (user == null) {
      yield null;
    } else {
      try {
        final authService = ref.read(authServiceProvider);
        final profile = await authService.getCurrentUserProfile();
        yield profile;
      } catch (e) {
        print('Error loading user profile: $e');
        yield null;
      }
    }
  }
});

/// Provider that watches for user profile updates
final currentUserProfileProvider = FutureProvider<UserProfile?>((ref) async {
  final authService = ref.watch(authServiceProvider);
  return await authService.getCurrentUserProfile();
});

/// Auth state notifier for handling auth operations
class AuthNotifier extends StateNotifier<AsyncValue<UserProfile?>> {
  AuthNotifier(this.ref) : super(const AsyncValue.loading()) {
    _initialize();
  }

  final Ref ref;
  AuthService get _authService => ref.read(authServiceProvider);

  void _initialize() async {
    try {
      final profile = await _authService.getCurrentUserProfile();
      state = AsyncValue.data(profile);
      
      // Load family ID if user is authenticated
      if (profile != null) {
        await _loadFamilyId(profile.uid);
      }
    } catch (e) {
      state = AsyncValue.data(null);
    }
  }

  /// Load family ID for the user
  Future<void> _loadFamilyId(String userId) async {
    try {
      final familyService = ref.read(familyServiceProvider);
      final familyId = await familyService.findUserFamily(userId);
      
      if (familyId != null) {
        print('Setting family ID: $familyId for user: $userId');
        ref.read(currentFamilyIdProvider.notifier).state = familyId;
      } else {
        print('No family found for user: $userId');
      }
    } catch (e) {
      print('Error loading family ID: $e');
    }
  }

  /// Sign in with Google
  Future<void> signInWithGoogle() async {
    state = const AsyncValue.loading();
    try {
      final profile = await _authService.signInWithGoogle();
      state = AsyncValue.data(profile);
      
      // Load family ID from Firestore
      await _loadFamilyId(profile.uid);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Sign in with email and password
  Future<void> signInWithEmail(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final profile = await _authService.signInWithEmail(email, password);
      state = AsyncValue.data(profile);
      
      // Load family ID from Firestore
      await _loadFamilyId(profile.uid);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Sign up with email and password
  Future<void> signUpWithEmail(
    String email,
    String password,
    String displayName,
  ) async {
    state = const AsyncValue.loading();
    try {
      final profile = await _authService.signUpWithEmail(
        email,
        password,
        displayName,
      );
      state = AsyncValue.data(profile);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      await _authService.signOut();
      state = const AsyncValue.data(null);
      
      // Clear family ID
      ref.read(currentFamilyIdProvider.notifier).state = null;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _authService.resetPassword(email);
    } catch (e) {
      rethrow;
    }
  }
}

/// Provider for auth operations
final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<UserProfile?>>((ref) {
  return AuthNotifier(ref);
});
