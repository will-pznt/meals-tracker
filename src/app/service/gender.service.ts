import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GenderService {
  private gender$ = new BehaviorSubject<'men' | 'women'>('men');
  genderChanges = this.gender$.asObservable();

  setGender(g: 'men' | 'women'): void {
    this.gender$.next(g);
  }

  getGender(): 'men' | 'women' {
    return this.gender$.value;
  }
}
