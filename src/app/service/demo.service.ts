import { Service, signal } from '@angular/core';

/**
 * Tracks whether the app is in demo mode (a visitor clicked "View Demo" on the login page).
 * In demo mode, MealService serves mock data instead of touching Firebase, so visitors can
 * explore the app without creating an account and without any risk to real data.
 */
@Service()
export class DemoService {
  private demoModeSignal = signal(false);
  readonly isDemoMode = this.demoModeSignal.asReadonly();

  enable(): void {
    this.demoModeSignal.set(true);
  }

  disable(): void {
    this.demoModeSignal.set(false);
  }
}
