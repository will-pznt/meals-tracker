import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AppComponent } from './app.component';
import { AuthService } from './service/auth-service.service';
import { DemoService } from './service/demo.service';

describe('AppComponent', () => {
  const currentUser = signal<null | undefined>(undefined);

  beforeEach(() => {
    sessionStorage.clear();
    currentUser.set(undefined);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { currentUser, user: of(null) } }],
    });
  });

  it('shows a spinner until the auth state is known', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();

    currentUser.set(null);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });

  it('shows the demo banner and leaves demo mode to sign up', async () => {
    TestBed.inject(DemoService).enable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    const banner = fixture.nativeElement.querySelector('.demo-banner') as HTMLElement;
    expect(banner.textContent).toContain('demo');
    banner.querySelector('button')!.click();
    await fixture.whenStable();

    expect(TestBed.inject(DemoService).isDemoMode()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(fixture.nativeElement.querySelector('.demo-banner')).toBeNull();
  });
});
