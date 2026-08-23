import { initializeApp, cert, getApps } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount = null;

// Option 1: Load from individual environment variables
if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  // Replace escape sequences in private key (common when key is formatted on a single line in .env)
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
  
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey
  };
} 
// Option 2: Try to load from local JSON file
else {
  const localKeyPath = path.resolve(__dirname, "../firebase-admin-key.json");
  if (fs.existsSync(localKeyPath)) {
    try {
      const rawData = fs.readFileSync(localKeyPath, "utf-8");
      serviceAccount = JSON.parse(rawData);
    } catch (err) {
      console.error("Failed to parse local firebase-admin-key.json:", err.message);
    }
  }
}

// Check if credentials exist before initializing
if (!serviceAccount) {
  console.warn(
    "WARNING: Firebase Admin SDK credentials are not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env, or place firebase-admin-key.json in the backend/ directory."
  );
} else {
  try {
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error.message);
  }
}

const firebaseAdmin = {
  get apps() {
    return getApps();
  },
  auth() {
    return getAuth();
  }
};

export default firebaseAdmin;
