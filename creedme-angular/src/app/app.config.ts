// src/app/app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // <-- ¡IMPORTANTE! Importar el proveedor de HttpClient

import { routes } from './app.routes';

// Importar los proveedores de Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    // --- Configuración Esencial de Angular ---
    provideRouter(routes), 
    provideHttpClient(), // <-- ¡AÑADIDO! Esto permite la inyección de HttpClient en tus servicios.

    // --- Configuración de Firebase (Como la tenías) ---
    provideFirebaseApp(() => initializeApp({ 
      projectId: "creedme-14d24", 
      appId: "1:464744911951:web:764281c057d8520512863a", 
      storageBucket: "creedme-14d24.appspot.com", 
      apiKey: "AIzaSyBV0CzEze_QWiAfESn71cSHh3DA5oWcdFk", 
      authDomain: "creedme-14d24.firebaseapp.com", 
      messagingSenderId: "464744911951" 
    })),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};