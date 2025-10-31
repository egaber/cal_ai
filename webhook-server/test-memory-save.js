// Test memory saving directly
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('\n🧪 Testing Memory Save...\n');
console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

async function testMemorySave() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized\n');

    // Test family ID (replace with your actual family ID)
    const familyId = 'jmY3rA3u3cenXj07rMwO'; // From your logs
    
    console.log(`📝 Creating test memory for family: ${familyId}\n`);
    
    // Create memory reference
    const memoryRef = collection(db, 'families', familyId, 'memory');
    console.log(`📍 Path: families/${familyId}/memory/\n`);
    
    // Test message
    const testMessage = 'הגן של אלון ויעל נפתח ב7:10 ואפשר להגיע עד 8:30';
    console.log(`💬 Test message: "${testMessage}"\n`);
    
    // Pattern match
    const kinderMatch = testMessage.match(/גן.*?(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/);
    
    if (kinderMatch) {
      console.log(`✅ Pattern matched!`);
      console.log(`   Opening time: ${kinderMatch[1]}`);
      console.log(`   Pickup time: ${kinderMatch[2]}\n`);
      
      // Create memory document
      const memoryData = {
        memoryType: 'place',
        text: `גן אלון ויעל - פתיחה ${kinderMatch[1]}, איסוף עד ${kinderMatch[2]}`,
        source: 'ai_inferred',
        confidence: 0.9,
        relatedUserIds: [],
        tags: ['kindergarten', 'whatsapp', 'test'],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        structured: {
          type: 'kindergarten',
          openTime: kinderMatch[1],
          pickupTime: kinderMatch[2]
        }
      };
      
      console.log('📄 Memory document:', JSON.stringify(memoryData, null, 2));
      console.log('\n💾 Saving to Firestore...\n');
      
      const docRef = await addDoc(memoryRef, memoryData);
      
      console.log(`✅ SUCCESS! Memory saved with ID: ${docRef.id}`);
      console.log(`📍 Full path: families/${familyId}/memory/${docRef.id}`);
      console.log('\n🔍 Check Firestore Console to verify:\n');
      console.log(`   https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/data/~2Ffamilies~2F${familyId}~2Fmemory`);
      
    } else {
      console.log('❌ Pattern did NOT match!');
      console.log('   The regex pattern may need adjustment.');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.error('\nError details:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  PERMISSION DENIED!');
      console.error('   Check Firestore rules allow write access to memory collection');
      console.error('   Rules should have been deployed earlier');
    }
  }
}

testMemorySave();
