import { Injectable } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly authState$: Observable<User | null>;

  constructor(private auth: Auth, private firestore: Firestore) {
    this.authState$ = authState(this.auth);
  }

  async register(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.createUserDocument(userCredential.user);
    return userCredential.user;
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    return userCredential.user;
  }

  async logout(): Promise<void> {
    return await signOut(this.auth);
  }

  private async createUserDocument(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userRef, {
      username: user.email?.split('@')[0] || 'anonymous',
      eloRating: 500,
      createdAt: new Date()
    });
  }

  async isAdmin(user: User): Promise<boolean> {
    const tokenResult = await user.getIdTokenResult(true);
    return !!tokenResult.claims['admin'];
  }
}
