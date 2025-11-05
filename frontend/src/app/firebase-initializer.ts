import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { environment } from "../environments/environment";

// Inicializa Firebase y exporta todas las instancias de servicio necesarias.
// Este código se ejecutará una sola vez en cuanto el archivo sea importado.

const firebaseApp = initializeApp(environment.firebase);

export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);