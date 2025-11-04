import { Injectable, inject } from '@angular/core';
import { Auth, User, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  // Observable para escuchar cambios en el estado de autenticación
  readonly authState$: Observable<User | null> = authState(this.auth);

  constructor() { }

  // Registrar un nuevo usuario
  async register(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = userCredential.user;
    // Crear un documento de usuario en Firestore
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userRef, {
      username: user.email?.split('@')[0] || 'new_user',
      eloRating: 500,
      createdAt: new Date()
    });
    return user;
  }

  // Iniciar sesión
  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    return userCredential.user;
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    return await signOut(this.auth);
  }
}