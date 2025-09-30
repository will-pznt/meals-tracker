import { Injectable, inject } from '@angular/core';
import { Auth, browserSessionPersistence, signInWithEmailAndPassword, signOut, user, User } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, setPersistence, UserCredential } from 'firebase/auth';
import { BehaviorSubject, from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebaseAuth = inject(Auth);

  user: Observable<User | null>;
  private initialized = new BehaviorSubject<boolean>(false);

  constructor() {
    this.setSessionStoragePersistence();
    this.user = user(this.firebaseAuth);
    this.user.subscribe(() => {
      this.initialized.next(true);
    });
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
   * Set Firebase Auth persistence to session storage
   * This keeps the user logged in across page reloads, but logs them out when the browser/tab is closed
   */
  private setSessionStoragePersistence(): void {
    setPersistence(this.firebaseAuth, browserSessionPersistence);
  }

  /**
   * Get the current user's ID, or null if not logged in
   * @return User ID or null
   */
  get currentUserId(): string | null {
    return this.firebaseAuth.currentUser ? this.firebaseAuth.currentUser.uid : null;
  }

  /**
   * Get the current user's ID token, or null if not logged in
   * @returns Promise that resolves to the ID token or null
   */
  async getIdToken(): Promise<string | null> {
    const user = this.firebaseAuth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  /**
   * Register a new user with email and password
   * @param email
   * @param password
   * @returns Observable that completes when registration is successful
   */
  registerWithEmail(email: string, password: string): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.firebaseAuth, email, password));
  }

  /**
   * Login with email and password
   * @param email
   * @param password
   * @returns Observable that completes when login is successful
   */
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password).then(() => {});
    return from(promise);
  }

  /** Logout the current user */
  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth).then(() => {
      sessionStorage.clear();
    });
    return from(promise);
  }
}
