import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service, signal } from '@angular/core';

export const DEMO_STORAGE_KEY = 'meals-tracker.demo';

@Service()
export class DemoService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly demoModeSignal = signal(this.readStored());
  readonly isDemoMode = this.demoModeSignal.asReadonly();

  enable(): void {
    this.demoModeSignal.set(true);
    this.store(true);
  }

  disable(): void {
    this.demoModeSignal.set(false);
    this.store(false);
  }

  private readStored(): boolean {
    if (!this.isBrowser) return false;
    try {
      return sessionStorage.getItem(DEMO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private store(enabled: boolean): void {
    if (!this.isBrowser) return;
    try {
      if (enabled) sessionStorage.setItem(DEMO_STORAGE_KEY, 'true');
      else sessionStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      return;
    }
  }
}
