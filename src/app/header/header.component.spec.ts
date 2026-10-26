import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { HeaderComponent } from './header.component';
import { AuthService } from '../service/auth-service.service';
import { DemoService } from '../service/demo.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  const user = new BehaviorSubject<{ uid: string } | null>(null);
  const auth = { user, logout: vi.fn() };
  const router = { navigate: vi.fn() };
  const snackBar = { open: vi.fn() };
  const demo = { isDemoMode: signal(false), disable: vi.fn() };

  function buttonText(): string | undefined {
    return (fixture.nativeElement as HTMLElement).querySelector('.logout-button')?.textContent?.trim();
  }

  beforeEach(async () => {
    user.next(null);
    demo.isDemoMode.set(false);
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: DemoService, useValue: demo },
      ],
    });
    fixture = TestBed.createComponent(HeaderComponent);
    await fixture.whenStable();
  });

  it('shows no action for anonymous visitors', () => {
    expect(buttonText()).toBeUndefined();
  });

  it('shows Logout for signed-in users and signs them out', async () => {
    auth.logout.mockReturnValue(of(undefined));
    user.next({ uid: 'u1' });
    await fixture.whenStable();
    expect(buttonText()).toContain('Logout');

    (fixture.nativeElement.querySelector('.logout-button') as HTMLButtonElement).click();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('reports a failed logout', async () => {
    auth.logout.mockReturnValue(throwError(() => new Error('offline')));
    user.next({ uid: 'u1' });
    await fixture.whenStable();
    fixture.componentInstance.logout();
    expect(snackBar.open).toHaveBeenCalledWith('❌ Logout failed', 'Close', expect.anything());
  });

  it('shows Exit Demo in demo mode and leaves it', async () => {
    demo.isDemoMode.set(true);
    await fixture.whenStable();
    expect(buttonText()).toContain('Exit Demo');

    fixture.componentInstance.exitDemo();
    expect(demo.disable).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
