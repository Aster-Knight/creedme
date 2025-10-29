import { Injectable } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface UserProfile {
  username: string;
  eloRating: number;
  createdAt: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  currentUserProfile$: Observable<UserProfile | null>;

  constructor(private firestore: Firestore, private authService: AuthService) {
    this.currentUserProfile$ = this.authService.authState$.pipe(
      switchMap(user => {
        if (user) {
          return docData(doc(this.firestore, `users/${user.uid}`)) as Observable<UserProfile | null>;
        } else {
          return of(null);
        }
      })
    );
  }
}
