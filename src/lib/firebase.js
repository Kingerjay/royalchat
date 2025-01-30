import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "chat-app-9278e.firebaseapp.com",
  projectId: "chat-app-9278e",
  storageBucket: "chat-app-9278e.firebasestorage.app",
  messagingSenderId: "19337974266",
  appId: "1:19337974266:web:3a2f62c1f70d212dcd5443"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()