import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth-service.service';
import { FIREBASE_AUTH } from '../firebase';

describe('AuthService', () => {
  function setup(currentUser: { uid: string } | null): AuthService {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: FIREBASE_AUTH, useValue: { currentUser } },
      ],
    });
    return TestBed.inject(AuthService);
  }

  it('reports no user during server rendering', async () => {
    const service = setup(null);
    await expect(firstValueFrom(service.user)).resolves.toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('exposes the current user id from Firebase Auth', () => {
    expect(setup({ uid: 'user-1' }).currentUserId).toBe('user-1');
  });

  it('returns null when signed out', () => {
    expect(setup(null).currentUserId).toBeNull();
  });
});
