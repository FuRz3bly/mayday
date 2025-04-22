// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyAyeVTvaCDXGGswJnh5V7LLfhiqB9e25gw",
  authDomain: "mayday-4b34f.firebaseapp.com",
  projectId: "mayday-4b34f",
  storageBucket: "mayday-4b34f.firebasestorage.app",
  messagingSenderId: "744662151881",
  appId: "1:744662151881:web:4b2336cf3aeabaaa395318",
  measurementId: "G-JXC34QE925"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;