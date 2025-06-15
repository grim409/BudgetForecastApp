import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  CACHE_SIZE_UNLIMITED,
  setLogLevel,
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

let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling:    true,
    experimentalAutoDetectLongPolling: true,
    cacheSizeBytes:                   CACHE_SIZE_UNLIMITED,
  });
} catch (e) {
  // already initialized — fall back
  db = getFirestore(app);
}

setLogLevel('error');

export { db };
