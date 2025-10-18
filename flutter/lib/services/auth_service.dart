import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'firebase_service.dart';

/// User profile data matching web app schema
class UserProfile {
  final String uid;
  final String email;
  final String displayName;
  final String? photoURL;
  final String? phoneNumber;
  final DateTime createdAt;
  final DateTime lastLoginAt;
  final String? familyId;
  final Map<String, dynamic> preferences;

  UserProfile({
    required this.uid,
    required this.email,
    required this.displayName,
    this.photoURL,
    this.phoneNumber,
    required this.createdAt,
    required this.lastLoginAt,
    this.familyId,
    Map<String, dynamic>? preferences,
  }) : preferences = preferences ?? _defaultPreferences();

  static Map<String, dynamic> _defaultPreferences() => {
        'theme': 'system',
        'language': 'en',
        'timezone': DateTime.now().timeZoneName,
        'calendarView': 'week',
        'notifications': true,
      };

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      uid: json['uid'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      photoURL: json['photoURL'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      createdAt: (json['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      lastLoginAt: (json['lastLoginAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      familyId: json['familyId'] as String?,
      preferences: json['preferences'] as Map<String, dynamic>? ?? _defaultPreferences(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'displayName': displayName,
      if (photoURL != null) 'photoURL': photoURL,
      if (phoneNumber != null) 'phoneNumber': phoneNumber,
      'preferences': preferences,
      if (familyId != null) 'familyId': familyId,
    };
  }
}

/// Authentication service for Calendar AI Flutter app.
/// 
/// Provides email/password and Google Sign-In authentication
/// matching the web app's authentication flow.
class AuthService {
  final FirebaseAuth _auth = FirebaseService.auth;
  final FirebaseFirestore _firestore = FirebaseService.firestore;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar',
    ],
  );

  /// Stream of authentication state changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Get current Firebase user
  User? get currentUser => _auth.currentUser;

  /// Check if user is authenticated
  bool get isAuthenticated => currentUser != null;

  /// Sign in with Google
  Future<UserProfile> signInWithGoogle() async {
    try {
      // Trigger Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        throw Exception('Google Sign-In was cancelled');
      }

      // Obtain auth details
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      // Create Firebase credential
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Sign in to Firebase
      final userCredential = await _auth.signInWithCredential(credential);
      final user = userCredential.user!;

      // Store Google Calendar token if available
      if (googleAuth.accessToken != null) {
        await _storeGoogleCalendarToken(user.uid, googleAuth.accessToken!);
      }

      // Get or create user profile
      return await _getOrCreateUserProfile(user);
    } catch (e) {
      print('Error signing in with Google: $e');
      throw Exception('Failed to sign in with Google: $e');
    }
  }

  /// Sign in with email and password
  Future<UserProfile> signInWithEmail(String email, String password) async {
    try {
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      return await _getUserProfile(userCredential.user!.uid);
    } catch (e) {
      print('Error signing in with email: $e');
      throw Exception('Failed to sign in: $e');
    }
  }

  /// Sign up with email and password
  Future<UserProfile> signUpWithEmail(
    String email,
    String password,
    String displayName,
  ) async {
    try {
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      final user = userCredential.user!;
      
      // Create user profile with display name
      final profile = await _createUserProfile(user, displayName: displayName);
      
      return profile;
    } catch (e) {
      print('Error signing up: $e');
      throw Exception('Failed to sign up: $e');
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      await Future.wait([
        _auth.signOut(),
        _googleSignIn.signOut(),
      ]);
    } catch (e) {
      print('Error signing out: $e');
      throw Exception('Failed to sign out: $e');
    }
  }

  /// Get user profile from Firestore
  Future<UserProfile> _getUserProfile(String uid) async {
    final doc = await _firestore.collection('users').doc(uid).get();
    
    if (!doc.exists) {
      throw Exception('User profile not found');
    }
    
    // Update last login
    await _firestore.collection('users').doc(uid).update({
      'lastLoginAt': FieldValue.serverTimestamp(),
    });
    
    return UserProfile.fromJson({...doc.data()!, 'uid': uid});
  }

  /// Get or create user profile
  Future<UserProfile> _getOrCreateUserProfile(User user) async {
    try {
      return await _getUserProfile(user.uid);
    } catch (e) {
      // Profile doesn't exist, create it
      return await _createUserProfile(user);
    }
  }

  /// Create new user profile in Firestore
  Future<UserProfile> _createUserProfile(
    User user, {
    String? displayName,
  }) async {
    final profile = UserProfile(
      uid: user.uid,
      email: user.email ?? '',
      displayName: displayName ?? user.displayName ?? user.email?.split('@')[0] ?? 'User',
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      createdAt: DateTime.now(),
      lastLoginAt: DateTime.now(),
    );

    final data = profile.toJson();
    data['createdAt'] = FieldValue.serverTimestamp();
    data['lastLoginAt'] = FieldValue.serverTimestamp();

    await _firestore.collection('users').doc(user.uid).set(data);
    
    // Create empty credentials document
    await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('data')
        .doc('credentials')
        .set({});

    return profile;
  }

  /// Store Google Calendar token
  Future<void> _storeGoogleCalendarToken(String uid, String token) async {
    try {
      await _firestore
          .collection('users')
          .doc(uid)
          .collection('data')
          .doc('credentials')
          .set({
        'googleCalendarToken': token,
      }, SetOptions(merge: true));
    } catch (e) {
      print('Error storing Google Calendar token: $e');
      // Don't fail the sign-in if token storage fails
    }
  }

  /// Get current user profile
  Future<UserProfile?> getCurrentUserProfile() async {
    final user = currentUser;
    if (user == null) return null;
    
    try {
      return await _getUserProfile(user.uid);
    } catch (e) {
      print('Error getting current user profile: $e');
      return null;
    }
  }

  /// Update user profile
  Future<void> updateUserProfile(
    String uid,
    Map<String, dynamic> updates,
  ) async {
    try {
      await _firestore.collection('users').doc(uid).update({
        ...updates,
        'lastLoginAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error updating user profile: $e');
      throw Exception('Failed to update profile: $e');
    }
  }

  /// Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      print('Error sending password reset email: $e');
      throw Exception('Failed to send password reset email: $e');
    }
  }
}
