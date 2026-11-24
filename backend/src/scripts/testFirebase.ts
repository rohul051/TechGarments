/**
 * Firebase Firestore Connectivity & Diagnostic Script
 * Run with: npm run test:firebase
 */
import { db, auth, isFirebaseConfigured } from '../config/firebase.js';
import { config } from '../config/env.js';

async function testFirebaseConnection() {
  console.log('\n=============================================');
  console.log('   🔥 TechGarments Firebase Test Tool');
  console.log('=============================================');
  console.log(`Target Project ID: ${config.firebase.projectId}`);
  console.log(`Configured with credentials: ${isFirebaseConfigured ? 'YES' : 'NO'}`);

  if (!isFirebaseConfigured) {
    console.log('\n⚠️  Notice: serviceAccountKey.json is not yet present.');
    console.log('To connect to real Firestore in Google Cloud:');
    console.log(`1. Visit: https://console.firebase.google.com/project/${config.firebase.projectId}/settings/serviceaccounts/adminsdk`);
    console.log('2. Click "Generate new private key"');
    console.log('3. Save the downloaded JSON as "backend/serviceAccountKey.json"');
    console.log('4. Run "npm run test:firebase" again\n');
    process.exit(0);
  }

  try {
    console.log('\n[1/3] Testing Firestore ping document write...');
    const testDocRef = db.collection('_healthcheck').doc('connection_test');
    const testData = {
      project: config.firebase.projectId,
      testedAt: new Date().toISOString(),
      status: 'active',
    };
    await testDocRef.set(testData);
    console.log('✅ Write successful!');

    console.log('\n[2/3] Reading back document from Firestore...');
    const docSnap = await testDocRef.get();
    if (docSnap.exists) {
      console.log('✅ Read successful! Data:', docSnap.data());
    } else {
      console.warn('⚠️ Document was not found.');
    }

    console.log('\n[3/3] Checking Firebase Auth service...');
    // List up to 1 user to verify auth service connectivity
    const userRecords = await auth.listUsers(1);
    console.log(`✅ Auth connection verified! Total registered users in sample: ${userRecords.users.length}`);

    console.log('\n=============================================');
    console.log('🎉 Firebase & Cloud Firestore are 100% connected!');
    console.log('=============================================\n');
  } catch (error) {
    console.error('\n❌ Firebase connection test error:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify that Cloud Firestore is enabled in Firebase Console:');
    console.log(`   https://console.firebase.google.com/project/${config.firebase.projectId}/firestore`);
    console.log('2. Ensure your serviceAccountKey.json corresponds to project:', config.firebase.projectId);
  }
}

testFirebaseConnection().catch(console.error);
