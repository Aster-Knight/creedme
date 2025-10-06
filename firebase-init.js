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

// Inicializa la aplicación de Firebase
const app = firebase.initializeApp(firebaseConfig);

// Crea las variables globales para la base de datos y la autenticación
const db = firebase.firestore();
const auth = firebase.auth();