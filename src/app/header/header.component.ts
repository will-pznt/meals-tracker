import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../service/auth-service.service';
import { DemoService } from '../service/demo.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private demoService = inject(DemoService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  protected isDemoMode = this.demoService.isDemoMode;

  protected isLoggedIn = toSignal(this.authService.user.pipe(map((user) => !!user)), { initialValue: false });

  /**
   * Log the current user out and redirect to the login page.
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.snackBar.open('❌ Logout failed', 'Close', { duration: 3000 }),
    });
  }

  /**
   * Leave demo mode and return to the login page.
   */
  exitDemo(): void {
    this.demoService.disable();
    this.router.navigate(['/login']);
  }
}
