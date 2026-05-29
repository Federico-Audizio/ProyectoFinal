import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyDc8jkXVnp-ARE_2xHqV8oy9r6oEpz8f80",
  authDomain: "proyectofinal-78eb4.firebaseapp.com",
  projectId: "proyectofinal-78eb4",
  storageBucket: "proyectofinal-78eb4.firebasestorage.app",
  messagingSenderId: "1001853852606",
  appId: "1:1001853852606:web:7e0b0d3d2a7846ad60b7ef",
  measurementId: "G-0PHTHXEQW9"
};

//console.log(firebaseConfig.apiKey);

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export const db = getFirestore(app);