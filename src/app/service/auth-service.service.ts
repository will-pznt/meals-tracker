import { isPlatformBrowser } from '@angular/common';
import { Injectable, NgZone, inject, PLATFORM_ID } from '@angular/core';
import { Auth, User, UserCredential } from '@angular/fire/auth';

import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { BehaviorSubject, from, Observable, of, shareReplay, switchMap, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebaseAuth = inject(Auth);
  private zone = inject(NgZone);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  user: Observable<User | null>;
  private initialized = new BehaviorSubject<boolean>(false);

  private persistenceReady: Promise<void>;

  constructor() {
    this.persistenceReady = this.setSessionStoragePersistence();
    this.user = this.buildUserStream();
    this.user.subscribe(() => {
      this.initialized.next(true);
    });
  }


  private buildUserStream(): Observable<User | null> {
    if (!this.isBrowser) return of(null);
    return new Observable<User | null>((subscriber) =>
      onAuthStateChanged(
        this.firebaseAuth,
        (currentUser) => this.zone.run(() => subscriber.next(currentUser)),
        (error) => this.zone.run(() => subscriber.error(error)),
      ),
    ).pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }

  /**
   * Observable that emits true when Firebase Auth is initialized
   * and the current user is known (either logged in or not)
   * @returns Observable<boolean>
   */
  get isInitialized(): Observable<boolean> {
    return this.initialized.asObservable();
  }

  /**
   * Set Firebase Auth persistence to session storage.
   * This keeps the user logged in across page reloads, but logs them out when the browser/tab is closed.
   * Browser-only: `browserSessionPersistence` relies on `sessionStorage`, which doesn't exist during SSR/prerendering.
   */
  private setSessionStoragePersistence(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    return setPersistence(this.firebaseAuth, browserSessionPersistence);
  }

  /**
   * Get the current user's ID, or null if not logged in
   * @return User ID or null
   */
  get currentUserId(): string | null {
    return this.firebaseAuth.currentUser ? this.firebaseAuth.currentUser.uid : null;
  }

  /**
   * Get the current user's ID token, or null if not logged in.
   * Waits for the auth state to be known instead of reading `firebaseAuth.currentUser`
   * synchronously, which can be null immediately after a page reload/SSR hydration
   * before Firebase has finished restoring the session.
   * @returns Observable emitting the ID token or null
   */
  getIdToken(): Observable<string | null> {
    return this.user.pipe(
      take(1),
      switchMap((currentUser) => (currentUser ? from(currentUser.getIdToken()) : of(null))),
    );
  }

  /**
   * Register a new user with email and password
   * @param email
   * @param password
   * @returns Observable that completes when registration is successful
   */
  registerWithEmail(email: string, password: string): Observable<UserCredential> {
    const promise = this.persistenceReady.then(() =>
      createUserWithEmailAndPassword(this.firebaseAuth, email, password),
    );
    return from(promise);
  }

  /**
   * Login with email and password
   * @param email
   * @param password
   * @returns Observable that completes when login is successful
   */
  login(email: string, password: string): Observable<void> {
    const promise = this.persistenceReady.then(() =>
      signInWithEmailAndPassword(this.firebaseAuth, email, password).then(() => { }),
    );
    return from(promise);
  }

  /** Logout the current user */
  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth).then(() => {
      if (this.isBrowser) sessionStorage.clear();
    });
    return from(promise);
  }
}
