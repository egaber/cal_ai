import 'package:cloud_firestore/cloud_firestore.dart';
import 'firebase_service.dart';

/// Service for managing family-related operations.
/// 
/// Handles discovering which family a user belongs to and managing
/// family membership data.
class FamilyService {
  final FirebaseFirestore _firestore = FirebaseService.firestore;

  /// Find the family ID for a given user.
  /// 
  /// Uses a collection group query to efficiently find the user's family.
  /// Returns null if user is not a member of any family.
  Future<String?> findUserFamily(String userId) async {
    try {
      print('Searching for family for user: $userId');
      
      // Use collectionGroup to search across all 'members' subcollections
      final memberQuery = await _firestore
          .collectionGroup('members')
          .where(FieldPath.documentId, isEqualTo: userId)
          .limit(1)
          .get();
      
      if (memberQuery.docs.isNotEmpty) {
        final memberDoc = memberQuery.docs.first;
        // The parent of the member document is the members collection
        // The parent of that is the family document
        final familyId = memberDoc.reference.parent.parent?.id;
        
        if (familyId != null) {
          print('Found user $userId in family $familyId via collection group query');
          return familyId;
        }
      }
      
      // Fallback: Try direct collection scan if collection group didn't work
      print('Collection group query didn\'t find user, trying direct scan...');
      final familiesSnapshot = await _firestore.collection('families').get();
      
      for (final familyDoc in familiesSnapshot.docs) {
        final memberDoc = await familyDoc.reference
            .collection('members')
            .doc(userId)
            .get();
        
        if (memberDoc.exists) {
          print('Found user $userId in family ${familyDoc.id} via direct scan');
          return familyDoc.id;
        }
      }
      
      print('User $userId is not a member of any family');
      return null;
    } catch (e) {
      print('Error finding user family: $e');
      print('Stack trace: ${StackTrace.current}');
      return null;
    }
  }

  /// Get member data for a user in a specific family.
  Future<Map<String, dynamic>?> getMemberData(
    String familyId,
    String userId,
  ) async {
    try {
      final memberDoc = await _firestore
          .collection('families')
          .doc(familyId)
          .collection('members')
          .doc(userId)
          .get();
      
      if (!memberDoc.exists) {
        return null;
      }
      
      return memberDoc.data();
    } catch (e) {
      print('Error getting member data: $e');
      return null;
    }
  }

  /// Create a member entry for a user in a family.
  /// 
  /// This is useful when onboarding new users.
  Future<void> addMemberToFamily(
    String familyId,
    String userId,
    Map<String, dynamic> memberData,
  ) async {
    try {
      await _firestore
          .collection('families')
          .doc(familyId)
          .collection('members')
          .doc(userId)
          .set({
        ...memberData,
        'userId': userId,
        'addedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      
      print('Added user $userId to family $familyId');
    } catch (e) {
      print('Error adding member to family: $e');
      rethrow;
    }
  }

  /// Update member data in a family.
  Future<void> updateMemberData(
    String familyId,
    String userId,
    Map<String, dynamic> updates,
  ) async {
    try {
      await _firestore
          .collection('families')
          .doc(familyId)
          .collection('members')
          .doc(userId)
          .update(updates);
    } catch (e) {
      print('Error updating member data: $e');
      rethrow;
    }
  }
}
