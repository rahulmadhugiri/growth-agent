// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {app} from "firebase";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0y5Gb2EhBydbHdn7qy9LIOT6uzoTglvg",
  authDomain: "marketing-agent-8509c.firebaseapp.com",
  projectId: "marketing-agent-8509c",
  storageBucket: "marketing-agent-8509c.firebasestorage.app",
  messagingSenderId: "189930836059",
  appId: "1:189930836059:web:113c431581dd396687ef7e",
  measurementId: "G-P3E49CENGM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
