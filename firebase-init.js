// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBV0CzEze_QWiAfESn71cSHh3DA5oWcdFk",
  authDomain: "creedme-14d24.firebaseapp.com",
  projectId: "creedme-14d24",
  storageBucket: "creedme-14d24.firebasestorage.app",
  messagingSenderId: "464744911951",
  appId: "1:464744911951:web:764281c057d8520512863a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = firebase.firestore(); // Objeto para interactuar con la base de datos
const auth = firebase.auth();   // Objeto para interactuar con la autenticación