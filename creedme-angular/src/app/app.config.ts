import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "creedme-14d24", appId: "1:464744911951:web:764281c057d8520512863a", storageBucket: "creedme-14d24.firebasestorage.app", apiKey: "AIzaSyBV0CzEze_QWiAfESn71cSHh3DA5oWcdFk", authDomain: "creedme-14d24.firebaseapp.com", messagingSenderId: "464744911951" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())
  ]
};
