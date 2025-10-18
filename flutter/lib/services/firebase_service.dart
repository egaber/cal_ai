import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../config/firebase_config.dart';

/// Service for initializing and accessing Firebase services.
/// 
/// Provides singleton access to Firebase Auth and Firestore.
/// Must be initialized before use with `await FirebaseService.initialize()`.
class FirebaseService {
  static FirebaseApp? _app;
  static FirebaseAuth? _auth;
  static FirebaseFirestore? _firestore;

  /// Initialize Firebase with hardcoded configuration
  static Future<void> initialize() async {
    print('🔥 Initializing Firebase...');

    if (!FirebaseConfig.isConfigured) {
      print('❌ Firebase configuration is incomplete!');
      throw Exception(
        'Firebase configuration missing. Check firebase_config.dart',
      );
    }
    
    print('✓ Firebase configuration loaded');
    print('  Project: ${FirebaseConfig.projectId}');

    // Initialize Firebase
    try {
      _app = await Firebase.initializeApp(
        options: FirebaseOptions(
          apiKey: FirebaseConfig.apiKey,
          authDomain: FirebaseConfig.authDomain,
          projectId: FirebaseConfig.projectId,
          storageBucket: FirebaseConfig.storageBucket,
          messagingSenderId: FirebaseConfig.messagingSenderId,
          appId: FirebaseConfig.appId,
          measurementId: FirebaseConfig.measurementId,
        ),
      );
      print('✓ Firebase initialized successfully');
    } catch (e) {
      print('❌ Firebase initialization failed: $e');
      rethrow;
    }

    _auth = FirebaseAuth.instance;
    _firestore = FirebaseFirestore.instance;

    // Enable offline persistence for Firestore
    _firestore!.settings = const Settings(
      persistenceEnabled: true,
      cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
    );
    
    print('✓ Firebase services ready');
  }

  /// Get Firebase Auth instance
  static FirebaseAuth get auth {
    if (_auth == null) {
      throw Exception('FirebaseService not initialized. Call initialize() first.');
    }
    return _auth!;
  }

  /// Get Firestore instance
  static FirebaseFirestore get firestore {
    if (_firestore == null) {
      throw Exception('FirebaseService not initialized. Call initialize() first.');
    }
    return _firestore!;
  }

  /// Get current user
  static User? get currentUser => _auth?.currentUser;

  /// Check if user is authenticated
  static bool get isAuthenticated => currentUser != null;

  /// Get current user ID
  static String? get currentUserId => currentUser?.uid;

  /// Sign in anonymously (for testing/development)
  static Future<UserCredential> signInAnonymously() async {
    return await auth.signInAnonymously();
  }

  /// Sign out
  static Future<void> signOut() async {
    await auth.signOut();
  }
}
