import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { catchError, from, map, Observable, of, shareReplay } from 'rxjs';

import { FIREBASE_AUTH } from '../firebase';

@Service()
export class AuthService {
  private readonly firebaseAuth = inject(FIREBASE_AUTH);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly user: Observable<User | null> = this.isBrowser
    ? new Observable<User | null>((subscriber) =>
        onAuthStateChanged(
          this.firebaseAuth,
          (currentUser) => subscriber.next(currentUser),
          (error) => subscriber.error(error),
        ),
      ).pipe(
        catchError(() => of(null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      )
    : of(null);

  readonly currentUser = toSignal(this.user, { initialValue: undefined });

  get currentUserId(): string | null {
    return this.firebaseAuth.currentUser?.uid ?? null;
  }

  register(email: string, password: string): Observable<void> {
    return from(createUserWithEmailAndPassword(this.firebaseAuth, email, password)).pipe(map(() => undefined));
  }

  login(email: string, password: string): Observable<void> {
    return from(signInWithEmailAndPassword(this.firebaseAuth, email, password)).pipe(map(() => undefined));
  }

  logout(): Observable<void> {
    return from(
      signOut(this.firebaseAuth).then(() => {
        if (this.isBrowser) sessionStorage.clear();
      }),
    );
  }
}
