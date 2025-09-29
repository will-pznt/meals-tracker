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

  get isInitialized(): Observable<boolean> {
    return this.initialized.asObservable();
  }

  private setSessionStoragePersistence(): void {
    setPersistence(this.firebaseAuth, browserSessionPersistence);
  }

  get currentUserId(): string | null {
    return this.firebaseAuth.currentUser ? this.firebaseAuth.currentUser.uid : null;
  }

  async getIdToken(): Promise<string | null> {
    const user = this.firebaseAuth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  registerWithEmail(email: string, password: string): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.firebaseAuth, email, password));
  }

  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password).then(() => {});
    return from(promise);
  }

  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth).then(() => {
      sessionStorage.clear();
    });
    return from(promise);
  }
}
