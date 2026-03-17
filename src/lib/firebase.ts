import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence failed: Browser not supported.');
    }
});

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
