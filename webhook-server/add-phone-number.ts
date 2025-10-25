// Add phone number to user profile in Firestore
// Run this once: npx tsx add-phone-number.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addPhoneNumber() {
  try {
    console.log('🔍 Searching for users...\n');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    if (snapshot.empty) {
      console.log('❌ No users found in Firestore');
      return;
    }
    
    console.log(`Found ${snapshot.size} user(s):\n`);
    
    snapshot.docs.forEach((userDoc, index) => {
      const data = userDoc.data();
      console.log(`${index + 1}. User ID: ${userDoc.id}`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   Name: ${data.displayName || 'N/A'}`);
      console.log(`   Phone: ${data.phoneNumber || 'NOT SET'}`);
      console.log('');
    });
    
    // Get the first user (assuming it's you)
    const firstUserDoc = snapshot.docs[0];
    const userData = firstUserDoc.data();
    
    if (userData.phoneNumber) {
      console.log('✅ Phone number already set:', userData.phoneNumber);
      console.log('   If this is wrong, manually update it in Firebase Console');
    } else {
      console.log('📝 Adding phone number to user:', firstUserDoc.id);
      
      const phoneNumber = '+972502234226'; // Your WhatsApp number
      
      await updateDoc(doc(db, 'users', firstUserDoc.id), {
        phoneNumber: phoneNumber
      });
      
      console.log('✅ Phone number added successfully!');
      console.log(`   User: ${firstUserDoc.id}`);
      console.log(`   Phone: ${phoneNumber}`);
      console.log('\n🎉 Now you can ask "איזה משימות יש לי?" via WhatsApp!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addPhoneNumber();
