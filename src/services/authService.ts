import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile, UserPreferences, UserData, MemoryData } from '../types/user';
import { FamilyMember } from '../types/calendar';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Initialize default user preferences
const getDefaultPreferences = (): UserPreferences => ({
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  calendarView: 'week',
  notifications: true,
});

// REMOVED: Default family members are now managed through family system
// REMOVED: Default memory data is now managed through family system

// Create user profile in Firestore
const createUserProfile = async (user: User): Promise<UserProfile> => {
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || undefined,
    phoneNumber: user.phoneNumber || undefined,
    createdAt: new Date(),
    lastLoginAt: new Date(),
    preferences: getDefaultPreferences(),
    // familyId will be set when user creates or joins a family
  };

  // Prepare data for Firestore (remove undefined values)
  const firestoreData: any = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    preferences: getDefaultPreferences(),
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };

  // Only add optional fields if they exist
  if (user.photoURL) {
    firestoreData.photoURL = user.photoURL;
  }
  if (user.phoneNumber) {
    firestoreData.phoneNumber = user.phoneNumber;
  }

  // Create user document
  await setDoc(doc(db, 'users', user.uid), firestoreData);

  // Create empty credentials document
  await setDoc(doc(db, 'users', user.uid, 'data', 'credentials'), {});

  return userProfile;
};

// Get or create user profile
const getUserProfile = async (user: User): Promise<UserProfile> => {
  const userDoc = await getDoc(doc(db, 'users', user.uid));

  if (userDoc.exists()) {
    // Update last login
    await updateDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp(),
    });

    const data = userDoc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: new Date(),
    } as UserProfile;
  }

  // Create new profile
  return await createUserProfile(user);
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserProfile> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Debug: Log user data
    console.log('Google Sign-In User Data:', {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      providerId: user.providerData[0]?.providerId,
    });

    // Get user profile (creates if doesn't exist)
    const profile = await getUserProfile(user);

    // Get Google Calendar credentials if available
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (token) {
      // Store Google Calendar token (update existing credentials doc)
      try {
        const credentialsRef = doc(db, 'users', user.uid, 'data', 'credentials');
        const credentialsDoc = await getDoc(credentialsRef);
        
        if (credentialsDoc.exists()) {
          await updateDoc(credentialsRef, {
            googleCalendarToken: token,
          });
        } else {
          await setDoc(credentialsRef, {
            googleCalendarToken: token,
          });
        }
      } catch (error) {
        console.error('Error storing Google Calendar token:', error);
        // Don't fail the sign-in if token storage fails
      }
    }

    return profile;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserProfile> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Update display name
    const profile = await createUserProfile(user);
    await updateDoc(doc(db, 'users', user.uid), {
      displayName,
    });

    return { ...profile, displayName };
  } catch (error: any) {
    console.error('Error signing up with email:', error);
    throw new Error(error.message || 'Failed to sign up');
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserProfile> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return await getUserProfile(result.user);
  } catch (error: any) {
    console.error('Error signing in with email:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Listen to auth state changes
export const onAuthStateChange = (
  callback: (user: UserProfile | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await getUserProfile(user);
      callback(profile);
    } else {
      callback(null);
    }
  });
};

// Get current user profile
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return await getUserProfile(user);
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      lastLoginAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

// Store face descriptor for face recognition
export const storeFaceDescriptor = async (
  uid: string,
  descriptor: number[]
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      faceDescriptor: descriptor,
      faceDescriptorUpdatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error storing face descriptor:', error);
    throw new Error(error.message || 'Failed to store face data');
  }
};

// Get user's face descriptor
export const getFaceDescriptor = async (
  uid: string
): Promise<number[] | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().faceDescriptor || null;
    }
    return null;
  } catch (error: any) {
    console.error('Error getting face descriptor:', error);
    return null;
  }
};
