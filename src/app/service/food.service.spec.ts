import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FoodService } from './food.service';
import { FoodItem } from '../data-models/FoodItem';

describe('FoodService', () => {
  let service: FoodService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FoodService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches through the proxy and defaults each result to 100 g', () => {
    let result: FoodItem[] = [];
    service.searchFoods('apple pie').subscribe((foods) => (result = foods));

    const req = http.expectOne((r) => r.url === '/api/foods/search');
    expect(req.request.params.get('q')).toBe('apple pie');
    req.flush({ foods: [{ fdcId: 1, description: 'Apple pie' }] });

    expect(result).toEqual([{ fdcId: 1, description: 'Apple pie', quantity: 100 }]);
  });

  it('handles a response without foods', () => {
    let result: FoodItem[] | undefined;
    service.searchFoods('x').subscribe((foods) => (result = foods));
    http.expectOne((r) => r.url === '/api/foods/search').flush({});
    expect(result).toEqual([]);
  });

  it('fetches food details by id', () => {
    service.getFoodDetails(1234).subscribe();
    const req = http.expectOne('/api/foods/1234');
    expect(req.request.method).toBe('GET');
    req.flush({ fdcId: 1234 });
  });
});
