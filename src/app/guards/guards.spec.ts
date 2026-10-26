import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  MaybeAsync,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { firstValueFrom, isObservable, Observable, of } from 'rxjs';

import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { AuthService } from '../service/auth-service.service';
import { DemoService } from '../service/demo.service';

async function resolve(result: MaybeAsync<GuardResult>): Promise<GuardResult> {
  return isObservable(result) ? firstValueFrom(result) : result;
}

describe('route guards', () => {
  let user: { uid: string } | null;

  beforeEach(() => {
    sessionStorage.clear();
    user = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useFactory: (): { user: Observable<{ uid: string } | null> } => ({ user: of(user) }) },
      ],
    });
  });

  function run(guard: typeof authGuard): Promise<GuardResult> {
    const injector = TestBed.inject(EnvironmentInjector);
    return resolve(
      runInInjectionContext(injector, () => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)),
    );
  }

  function url(result: GuardResult): string {
    return TestBed.inject(Router).serializeUrl(result as never);
  }

  describe('authGuard', () => {
    it('lets signed-in users through', async () => {
      user = { uid: 'u1' };
      await expect(run(authGuard)).resolves.toBe(true);
    });

    it('lets demo visitors through without an account', async () => {
      TestBed.inject(DemoService).enable();
      await expect(run(authGuard)).resolves.toBe(true);
    });

    it('redirects anonymous visitors to login', async () => {
      expect(url(await run(authGuard))).toBe('/login');
    });
  });

  describe('guestGuard', () => {
    it('lets anonymous visitors see the login page', async () => {
      await expect(run(guestGuard)).resolves.toBe(true);
    });

    it('sends signed-in users home', async () => {
      user = { uid: 'u1' };
      expect(url(await run(guestGuard))).toBe('/home');
    });
  });
});
