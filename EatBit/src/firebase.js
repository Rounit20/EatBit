import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";  // ✅ Import Storage

const firebaseConfig = {
  apiKey: "AIzaSyCpGI_nv1eBwKHc99wmiF48ogOef5UYLzc",
  authDomain: "eatbit-adbda.firebaseapp.com",
  projectId: "eatbit-adbda",
  storageBucket: "eatbit-adbda.appspot.com",  // ✅ Ensure storage is set up
  messagingSenderId: "143894279429",
  appId: "1:143894279429:web:a67ddaf9c6e10bddfdf36c",
  measurementId: "G-0EJT77RCF4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);  // ✅ Initialize Storage

export { app, auth, googleProvider, db, storage };
