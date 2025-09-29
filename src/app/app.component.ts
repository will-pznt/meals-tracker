import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { AuthService } from './service/auth-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
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

  title = 'Daily Nutrient Requirements';
  loading = true;

  constructor() {
    this.auth.user.subscribe({
      next: () => (this.loading = false),
      error: () => (this.loading = false),
    });
  }
}
