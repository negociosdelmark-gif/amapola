import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Explicitly set browser local persistence for resilient mobile sessions
setPersistence(auth, browserLocalPersistence)
  .catch((err) => {
    console.error("Failed to set robust auth persistence:", err);
  });

const googleProvider = new GoogleAuthProvider();
// Prompt user to select account for robust multi-profile management
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize firestore with the custom databaseId if specified, or default
const db = initializeFirestore(app, {
  databaseId: config.firestoreDatabaseId || '(default)'
} as any);

export { app, auth, db, googleProvider };

