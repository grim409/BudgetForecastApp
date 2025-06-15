// src/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:             process.env.FIREBASE_API_KEY,
  authDomain:         process.env.FIREBASE_AUTH_DOMAIN,
  projectId:          process.env.FIREBASE_PROJECT_ID,
  storageBucket:      process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// force long-polling & unlimited cache
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes:              CACHE_SIZE_UNLIMITED,
});
