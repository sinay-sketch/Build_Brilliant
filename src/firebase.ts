import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { USE_FUNCTIONS_EMULATOR } from './lib/ai/flags'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// AI proxy lives in Cloud Functions (region us-central1). The client only ever
// calls these callables; the OpenAI key stays server-side in Secret Manager.
export const functions = getFunctions(app, 'us-central1')

if (USE_FUNCTIONS_EMULATOR) {
  try {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  } catch {
    // Emulator not running; client AI layer will fall back to authored content.
  }
}
