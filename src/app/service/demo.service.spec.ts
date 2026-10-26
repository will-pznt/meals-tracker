import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DEMO_STORAGE_KEY, DemoService } from './demo.service';

describe('DemoService', () => {
  beforeEach(() => sessionStorage.clear());

  it('starts disabled', () => {
    expect(TestBed.inject(DemoService).isDemoMode()).toBe(false);
  });

  it('persists demo mode in sessionStorage', () => {
    TestBed.inject(DemoService).enable();
    expect(sessionStorage.getItem(DEMO_STORAGE_KEY)).toBe('true');
  });

  it('restores demo mode after a reload', () => {
    sessionStorage.setItem(DEMO_STORAGE_KEY, 'true');
    expect(TestBed.inject(DemoService).isDemoMode()).toBe(true);
  });

  it('clears the stored flag when disabled', () => {
    const service = TestBed.inject(DemoService);
    service.enable();
    service.disable();
    expect(service.isDemoMode()).toBe(false);
    expect(sessionStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
  });

  it('ignores storage on the server', () => {
    sessionStorage.setItem(DEMO_STORAGE_KEY, 'true');
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const service = TestBed.inject(DemoService);
    expect(service.isDemoMode()).toBe(false);
    service.enable();
    expect(service.isDemoMode()).toBe(true);
  });
});
