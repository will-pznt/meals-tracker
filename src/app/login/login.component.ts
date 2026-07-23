import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';

import { AuthService } from '../service/auth-service.service';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
};

@Component({
  selector: 'app-login',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  authForm: FormGroup;
  isRegisterMode = false;
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.authForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        confirmPassword: [''],
      },
      { validators: this.passwordMatchValidator },
    );

    // Update validity on every keystroke
    this.authForm
      .get('password')
      ?.valueChanges.subscribe(() => this.authForm.updateValueAndValidity({ onlySelf: false }));
    this.authForm
      .get('confirmPassword')
      ?.valueChanges.subscribe(() => this.authForm.updateValueAndValidity({ onlySelf: false }));
  }

  /**
   * Validate that password and confirm password match
   * @param group
   * @returns
   */
  passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;

    if (!confirm || !password) return null;
    return password === confirm ? null : { mismatch: true };
  }

  /**
   * Toggle between login and register modes
   */
  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage.set(null);
    this.authForm.get('confirmPassword')?.setValidators(this.isRegisterMode ? Validators.required : null);
    this.authForm.get('confirmPassword')?.updateValueAndValidity();
  }

  /**
   * Handle form submission for login or registration
   * @returns
   */
  onSubmit(): void {
    this.authForm.markAllAsTouched();
    this.errorMessage.set(null);

    const email = this.authForm.get('email')?.value;
    const password = this.authForm.get('password')?.value;

    if (this.isRegisterMode) {
      if (this.authForm.hasError('mismatch')) return;
      this.loading.set(true);

      // Register then auto-login
      this.authService
        .registerWithEmail(email, password)
        .pipe(switchMap(() => this.authService.login(email, password)))
        .subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/home']);
          },
          error: (error: unknown) => {
            this.loading.set(false);
            this.errorMessage.set(this.toErrorMessage(error));
          },
        });
    } else {
      if (!this.authForm.valid) return;
      this.loading.set(true);

      this.authService.login(email, password).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/home']);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(this.toErrorMessage(error));
        },
      });
    }
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
