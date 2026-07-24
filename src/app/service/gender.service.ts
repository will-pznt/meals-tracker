import { Service, signal } from '@angular/core';

@Service()
export class GenderService {
  private genderSignal = signal<'men' | 'women'>('men');

  readonly gender = this.genderSignal.asReadonly();

  setGender(g: 'men' | 'women'): void {
    this.genderSignal.set(g);
  }
}
