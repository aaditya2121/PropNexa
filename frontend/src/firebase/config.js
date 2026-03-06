import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyCzaTyGZTk-l7Lk-56CAKBdP2QjCXYkNBw",
    authDomain: "propnexa.firebaseapp.com",
    projectId: "propnexa",
    storageBucket: "propnexa.firebasestorage.app",
    messagingSenderId: "943433298458",
    appId: "1:943433298458:web:cbac2c85447d140b5817a3",
    measurementId: "G-2P9P436LGK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('Persistence not supported by browser');
    }
});

export const storage = getStorage(app);

export default app;
