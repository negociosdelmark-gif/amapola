// Firebase initialization with safe fallbacks
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyFakeKey_ForLocalTestingOnly",
  authDomain: "amapola-alerta.firebaseapp.com",
  projectId: "amapola-alerta",
  storageBucket: "amapola-alerta.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let app;
let db: any = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization failed, running with local in-memory state:", error);
}

export { app, db };

export function logAnalyticsEvent(eventName: string, params?: Record<string, any>) {
  console.log(`[Analytics Event] ${eventName}:`, params || {});
}
