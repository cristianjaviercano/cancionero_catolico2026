import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCIPxUxlacOaj9nL9TvcZz2PU6aXDAEp_c",
  authDomain: "cancionero-digital-cjcm.firebaseapp.com",
  projectId: "cancionero-digital-cjcm",
  storageBucket: "cancionero-digital-cjcm.firebasestorage.app",
  messagingSenderId: "899114080822",
  appId: "1:899114080822:web:e255406330e19b65475697"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
});
export default app;
