import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { LoginComponent } from './login.component';
import { AuthService } from '../service/auth-service.service';
import { DemoService } from '../service/demo.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  const auth = { login: vi.fn(), register: vi.fn() };
  const router = { navigate: vi.fn() };

  beforeEach(async () => {
    sessionStorage.clear();
    auth.login.mockReset().mockReturnValue(of(undefined));
    auth.register.mockReset().mockReturnValue(of(undefined));
    router.navigate.mockReset();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  async function submit(): Promise<void> {
    component.onSubmit(new Event('submit'));
    await fixture.whenStable();
  }

  it('logs in with valid credentials and goes home', async () => {
    component.loginModel.set({ email: 'me@example.com', password: 'secret1', confirmPassword: '' });
    await submit();

    expect(auth.login).toHaveBeenCalledWith('me@example.com', 'secret1');
    expect(auth.register).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('registers without signing in a second time', async () => {
    component.toggleMode();
    component.loginModel.set({ email: 'new@example.com', password: 'secret1', confirmPassword: 'secret1' });
    await submit();

    expect(auth.register).toHaveBeenCalledWith('new@example.com', 'secret1');
    expect(auth.login).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('does not submit an invalid form', async () => {
    component.loginModel.set({ email: 'not-an-email', password: '123', confirmPassword: '' });
    await submit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('requires matching passwords when registering', async () => {
    component.toggleMode();
    component.loginModel.set({ email: 'new@example.com', password: 'secret1', confirmPassword: 'secret2' });
    await submit();

    expect(auth.register).not.toHaveBeenCalled();
    expect(component.authForm.confirmPassword().errors()[0]?.message).toBe('Passwords do not match');
  });

  it('shows a friendly message for Firebase errors', async () => {
    auth.login.mockReturnValue(throwError(() => ({ code: 'auth/invalid-credential' })));
    component.loginModel.set({ email: 'me@example.com', password: 'wrong12', confirmPassword: '' });
    await submit();

    expect(component.errorMessage()).toBe('Incorrect email or password.');
    expect(component.loading()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for unknown errors', async () => {
    auth.login.mockReturnValue(throwError(() => new Error('boom')));
    component.loginModel.set({ email: 'me@example.com', password: 'secret1', confirmPassword: '' });
    await submit();
    expect(component.errorMessage()).toBe('Something went wrong. Please try again.');
  });

  it('enters demo mode', () => {
    component.viewDemo();
    expect(TestBed.inject(DemoService).isDemoMode()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('toggles between login and register with a keyboard-accessible button', async () => {
    const toggle = fixture.nativeElement.querySelector('.link-button') as HTMLButtonElement;
    expect(toggle.tagName).toBe('BUTTON');
    toggle.click();
    await fixture.whenStable();
    expect(component.isRegisterMode()).toBe(true);
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Register');
  });
});
