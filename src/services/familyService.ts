import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FamilyMember } from '../types/calendar';
import { MemoryData } from '../types/memory';

export interface Family {
  id: string;
  name: string;
  members: FamilyMember[];
  adminUserIds: string[]; // User IDs who can manage the family
  memberUserIds: string[]; // All user IDs in the family
  createdAt: Date;
  updatedAt: Date;
  inviteCode?: string;
}

export interface FamilyData {
  events: any[];
  memories: MemoryData;
}

// Generate a unique family invite code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create a new family
export const createFamily = async (
  familyName: string,
  creatorUserId: string,
  creatorDisplayName: string,
  creatorPhotoURL?: string
): Promise<Family> => {
  try {
    const familyRef = doc(collection(db, 'families'));
    const inviteCode = generateInviteCode();

    // Create the creator as a family member
    const creatorMember: FamilyMember = {
      id: creatorUserId,
      name: creatorDisplayName,
      role: 'parent',
      color: '#3b82f6',
      age: 0, // Age will be set by user in settings
      isYou: true,
      isMobile: true,
      avatar: creatorPhotoURL,
    };

    const family: Family = {
      id: familyRef.id,
      name: familyName,
      members: [creatorMember],
      adminUserIds: [creatorUserId],
      memberUserIds: [creatorUserId],
      createdAt: new Date(),
      updatedAt: new Date(),
      inviteCode,
    };

    // Store family document
    await setDoc(familyRef, {
      ...family,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Link user to family
    await setDoc(doc(db, 'users', creatorUserId), {
      familyId: familyRef.id,
    }, { merge: true });

    return family;
  } catch (error: any) {
    console.error('Error creating family:', error);
    throw new Error(error.message || 'Failed to create family');
  }
};

// Get family by ID
export const getFamily = async (familyId: string): Promise<Family | null> => {
  try {
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    
    if (familyDoc.exists()) {
      const data = familyDoc.data();
      return {
        ...data,
        id: familyDoc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Family;
    }
    
    return null;
  } catch (error: any) {
    console.error('Error getting family:', error);
    return null;
  }
};

// Get family by invite code
export const getFamilyByInviteCode = async (inviteCode: string): Promise<Family | null> => {
  try {
    const q = query(
      collection(db, 'families'),
      where('inviteCode', '==', inviteCode.toUpperCase())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const familyDoc = querySnapshot.docs[0];
    const data = familyDoc.data();
    
    return {
      ...data,
      id: familyDoc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Family;
  } catch (error: any) {
    console.error('Error getting family by invite code:', error);
    return null;
  }
};

// Join a family using invite code
export const joinFamily = async (
  inviteCode: string,
  userId: string,
  displayName: string,
  photoURL?: string
): Promise<Family> => {
  try {
    const family = await getFamilyByInviteCode(inviteCode);
    
    if (!family) {
      throw new Error('Invalid invite code');
    }
    
    // Check if user is already a member
    if (family.memberUserIds.includes(userId)) {
      return family;
    }
    
    // Create new family member
    const newMember: FamilyMember = {
      id: userId,
      name: displayName,
      role: 'parent',
      color: getNextMemberColor(family.members.length),
      age: 0, // Age will be set by user in settings
      isYou: true,
      isMobile: true,
      ...(photoURL && { avatar: photoURL }), // Only include avatar if photoURL exists
    };
    
    // Update family document
    await updateDoc(doc(db, 'families', family.id), {
      members: arrayUnion(newMember),
      memberUserIds: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
    
    // Link user to family
    await setDoc(doc(db, 'users', userId), {
      familyId: family.id,
    }, { merge: true });
    
    return {
      ...family,
      members: [...family.members, newMember],
      memberUserIds: [...family.memberUserIds, userId],
    };
  } catch (error: any) {
    console.error('Error joining family:', error);
    throw new Error(error.message || 'Failed to join family');
  }
};

// Add a child/non-user family member
export const addFamilyMember = async (
  familyId: string,
  member: Omit<FamilyMember, 'id'>
): Promise<void> => {
  try {
    const memberId = `member_${Date.now()}`;
    const newMember: FamilyMember = {
      ...member,
      id: memberId,
    };
    
    await updateDoc(doc(db, 'families', familyId), {
      members: arrayUnion(newMember),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error adding family member:', error);
    throw new Error(error.message || 'Failed to add family member');
  }
};

// Update family member
export const updateFamilyMember = async (
  familyId: string,
  memberId: string,
  updates: Partial<FamilyMember>
): Promise<void> => {
  try {
    const family = await getFamily(familyId);
    if (!family) throw new Error('Family not found');
    
    const updatedMembers = family.members.map(member =>
      member.id === memberId ? { ...member, ...updates } : member
    );
    
    await updateDoc(doc(db, 'families', familyId), {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating family member:', error);
    throw new Error(error.message || 'Failed to update family member');
  }
};

// Remove family member
export const removeFamilyMember = async (
  familyId: string,
  memberId: string
): Promise<void> => {
  try {
    const family = await getFamily(familyId);
    if (!family) throw new Error('Family not found');
    
    const memberToRemove = family.members.find(m => m.id === memberId);
    if (!memberToRemove) throw new Error('Member not found');
    
    await updateDoc(doc(db, 'families', familyId), {
      members: arrayRemove(memberToRemove),
      updatedAt: serverTimestamp(),
    });
    
    // If it's a user member, also remove from memberUserIds
    if (family.memberUserIds.includes(memberId)) {
      await updateDoc(doc(db, 'families', familyId), {
        memberUserIds: arrayRemove(memberId),
      });
    }
  } catch (error: any) {
    console.error('Error removing family member:', error);
    throw new Error(error.message || 'Failed to remove family member');
  }
};

// Get family events
export const getFamilyEvents = async (familyId: string): Promise<any[]> => {
  try {
    const eventsDoc = await getDoc(doc(db, 'families', familyId, 'data', 'events'));
    
    if (eventsDoc.exists()) {
      return eventsDoc.data().events || [];
    }
    
    return [];
  } catch (error: any) {
    console.error('Error getting family events:', error);
    return [];
  }
};

// Get family memories
export const getFamilyMemories = async (familyId: string): Promise<MemoryData> => {
  try {
    const memoriesDoc = await getDoc(doc(db, 'families', familyId, 'data', 'memories'));
    
    if (memoriesDoc.exists()) {
      return memoriesDoc.data() as MemoryData;
    }
    
    return {
      userMemories: [],
      familyMemories: [],
      places: [],
      travelInfo: [],
    };
  } catch (error: any) {
    console.error('Error getting family memories:', error);
    return {
      userMemories: [],
      familyMemories: [],
      places: [],
      travelInfo: [],
    };
  }
};

// Helper function to get color for new members
const getNextMemberColor = (memberCount: number): string => {
  const colors = [
    '#3b82f6', // blue
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#10b981', // green
    '#ef4444', // red
    '#06b6d4', // cyan
    '#f97316', // orange
  ];
  return colors[memberCount % colors.length];
};
