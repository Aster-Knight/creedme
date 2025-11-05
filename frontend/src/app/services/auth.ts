import { Injectable } from '@angular/core';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, getIdTokenResult } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { auth, firestore } from '../firebase-initializer'; // Ruta corregida

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = auth;
  private firestore = firestore;

  readonly authState$: Observable<User | null>;

  constructor() {
    this.authState$ = new Observable(subscriber => {
      const unsubscribe = onAuthStateChanged(this.auth, 
        user => subscriber.next(user),
        error => subscriber.error(error),
        () => subscriber.complete()
      );
      return unsubscribe;
    });
  }

  async getToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }

  async isAdmin(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) return false;
    const tokenResult = await getIdTokenResult(user, true); // Forzar recarga del token
    return tokenResult.claims['admin'] === true;
  }

  async register(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = userCredential.user;
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userRef, {
      username: user.email?.split('@')[0] || 'new_user',
      eloRating: 500,
      createdAt: new Date()
    });
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    return userCredential.user;
  }

  async logout(): Promise<void> {
    return await signOut(this.auth);
  }
}
