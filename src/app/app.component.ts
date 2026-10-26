import { Component, computed, inject } from '@angular/core';
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
  imports: [HeaderComponent, MatProgressSpinnerModule, RouterOutlet, FooterComponent],
})
export class AppComponent {
  private auth = inject(AuthService);
  private demoService = inject(DemoService);
  private router = inject(Router);

  protected readonly loading = computed(() => this.auth.currentUser() === undefined);
  protected readonly isDemoMode = this.demoService.isDemoMode;

  protected signUpFromDemo(): void {
    this.demoService.disable();
    this.router.navigate(['/login']);
  }
}
