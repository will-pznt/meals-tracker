import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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

@Component({
  selector: 'app-login',
  standalone: true,
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
  loading = false;

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

  passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;

    if (!confirm || !password) return null;
    return password === confirm ? null : { mismatch: true };
  }

  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.authForm.get('confirmPassword')?.setValidators(this.isRegisterMode ? Validators.required : null);
    this.authForm.get('confirmPassword')?.updateValueAndValidity();
  }

  onSubmit(): void {
    this.authForm.markAllAsTouched();

    const email = this.authForm.get('email')?.value;
    const password = this.authForm.get('password')?.value;

    if (this.isRegisterMode) {
      if (this.authForm.hasError('mismatch')) return;
      this.loading = true;

      // Register then auto-login
      this.authService
        .registerWithEmail(email, password)
        .pipe(switchMap(() => this.authService.login(email, password)))
        .subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/home']);
          },
          error: () => {
            this.loading = false;
          },
        });
    } else {
      if (!this.authForm.valid) return;
      this.loading = true;

      this.authService.login(email, password).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/home']);
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }
}
