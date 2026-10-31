// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDLmkvM8O3zbXyP_hvrq3M77NuqwCTJ4Fk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "registrocontable32.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "registrocontable32",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "registrocontable32.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "914035079269",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:914035079269:web:7020216b520c16ccd9ee8c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, auth, googleProvider };
