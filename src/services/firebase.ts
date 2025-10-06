import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBIek8JmAZrgW2jE21da_L3Ot403c_yrEk",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "formation-gds-database.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "formation-gds-database",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "formation-gds-database.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "263348143098",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:263348143098:web:3f945e92b9f520fdaf1a43"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;