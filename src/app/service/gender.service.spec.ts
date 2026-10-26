import { TestBed } from '@angular/core/testing';

import { GenderService } from './gender.service';

describe('GenderService', () => {
  it('defaults to men and can switch to women', () => {
    const service = TestBed.inject(GenderService);
    expect(service.gender()).toBe('men');
    service.setGender('women');
    expect(service.gender()).toBe('women');
  });
});
