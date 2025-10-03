
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your own Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBR18uUL9jpUkLMR5LA16eOldhwe--R6I8",
  authDomain: "hotel-e8a92.firebaseapp.com",
  projectId: "hotel-e8a92",
  storageBucket: "hotel-e8a92.firebasestorage.app",
  messagingSenderId: "310011491648",
  appId: "1:310011491648:web:e2bdad4db4013cc2fef6a5",
  measurementId: "G-57N1TEX590"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
