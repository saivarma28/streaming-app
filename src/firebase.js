import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration populated via environment variables with direct project fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAnsqmEXZEZ6SaP9Oukk1Qty82XmLSNMQA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "streaming-app-5e116.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "streaming-app-5e116",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "streaming-app-5e116.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "183783153299",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:183783153299:web:7a15e1853f5faabd0f3766"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { auth };
