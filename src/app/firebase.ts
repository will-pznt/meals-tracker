import { isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, browserSessionPersistence, getAuth, initializeAuth } from 'firebase/auth';
import { Database, getDatabase } from 'firebase/database';

import { environment } from '../environments/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: (): FirebaseApp => (getApps().length ? getApp() : initializeApp(environment.firebaseConfig)),
});

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
  providedIn: 'root',
  factory: (): Auth => {
    const app = inject(FIREBASE_APP);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return getAuth(app);
    try {
      return initializeAuth(app, { persistence: browserSessionPersistence });
    } catch {
      return getAuth(app);
    }
  },
});

export const FIREBASE_DB = new InjectionToken<Database>('FIREBASE_DB', {
  providedIn: 'root',
  factory: (): Database => getDatabase(inject(FIREBASE_APP)),
});
