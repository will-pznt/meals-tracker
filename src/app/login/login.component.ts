import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../service/auth-service.service';
import { debounce, email, form, FormField, minLength, required, submit, validate } from '@angular/forms/signals';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
};

interface LoginData {
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-login',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isRegisterMode = signal(false);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginModel = signal<LoginData>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  authForm = form(this.loginModel, (schemaPath) => {
    debounce(schemaPath.email, 500);
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Email is invalid' });

    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 6, { message: 'Password should be at least 6 characters' });

    required(schemaPath.confirmPassword, {
      when: () => this.isRegisterMode(),
      message: 'Confirm password is required',
    });

    validate(schemaPath.confirmPassword, ({ value, valueOf }) => {
      if (!this.isRegisterMode()) return undefined;
      if (value() !== valueOf(schemaPath.password)) {
        return { kind: 'mismatch', message: 'Passwords do not match' };
      }
      return undefined;
    });
  });

  /**
   * Toggle between login and register modes
   */
  toggleMode(): void {
    this.isRegisterMode.update((v) => !v);
    this.errorMessage.set(null);
  }

  /**
   * Handle form submission for login or registration
   * @param event
   */
  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);

    submit(this.authForm, async () => {
      const { email, password } = this.loginModel();
      this.loading.set(true);

      try {
        if (this.isRegisterMode()) {
          await firstValueFrom(this.authService.registerWithEmail(email, password));
        }
        await firstValueFrom(this.authService.login(email, password));
        this.router.navigate(['/home']);
      } catch (error) {
        this.errorMessage.set(this.toErrorMessage(error));
      } finally {
        this.loading.set(false);
      }
    });
  }

  /**
   * Map a Firebase Auth error to a user-friendly message
   * @param error
   */
  private toErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code;
    return (code && AUTH_ERROR_MESSAGES[code]) || 'Something went wrong. Please try again.';
  }
}
