import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterOutlet } from '@angular/router';

import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { AuthService } from './service/auth-service.service';
import { DemoService } from './service/demo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    CommonModule,
    MatGridListModule,
    MatButtonToggleModule,
    FormsModule,
    HeaderComponent,
    MatProgressSpinnerModule,
    RouterOutlet,
    FooterComponent,
  ],
})
export class AppComponent {
  private auth = inject(AuthService);
  private demoService = inject(DemoService);
  private router = inject(Router);

  title = 'Daily Nutrient Requirements';
  protected loading = signal(true);
  protected isDemoMode = this.demoService.isDemoMode;

  /**
   * Leave demo mode and go create a real account.
   */
  protected signUpFromDemo(): void {
    this.demoService.disable();
    this.router.navigate(['/login']);
  }

  constructor() {
    this.auth.user.subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }
}
