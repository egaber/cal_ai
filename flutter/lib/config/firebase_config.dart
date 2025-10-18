/// Firebase configuration for Calendar AI Flutter app.
/// 
/// Contains hardcoded Firebase credentials for the project.
/// These values come from Firebase Console.
class FirebaseConfig {
  // Firebase Web App Configuration
  static const String apiKey = 'AIzaSyDTJWo4AxtR155MlUkI1ReyJqPIiVteQ38';
  static const String authDomain = 'studio-1327110304-6895e.firebaseapp.com';
  static const String projectId = 'studio-1327110304-6895e';
  static const String storageBucket = 'studio-1327110304-6895e.appspot.com';
  static const String messagingSenderId = '289875815919';
  static const String appId = '1:289875815919:web:9b31ef854fd3f31ec25a1a';
  static const String measurementId = 'your_measurement_id';

  /// Check if all required Firebase config values are present
  static bool get isConfigured {
    return apiKey.isNotEmpty &&
        authDomain.isNotEmpty &&
        projectId.isNotEmpty &&
        storageBucket.isNotEmpty &&
        messagingSenderId.isNotEmpty &&
        appId.isNotEmpty;
  }

  /// Get Firebase options as a map
  static Map<String, String> get firebaseOptions => {
        'apiKey': apiKey,
        'authDomain': authDomain,
        'projectId': projectId,
        'storageBucket': storageBucket,
        'messagingSenderId': messagingSenderId,
        'appId': appId,
        'measurementId': measurementId,
      };
}
