import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { FoodSearchComponent } from './food-search.component';
import { FoodItem } from '../../data-models/FoodItem';
import { FoodService } from '../../service/food.service';

describe('FoodSearchComponent', () => {
  let fixture: ComponentFixture<FoodSearchComponent>;
  let component: FoodSearchComponent;
  const foodService = { searchFoods: vi.fn() };
  const apple: FoodItem = { fdcId: 7, description: 'Apple, raw', quantity: 100 };

  beforeEach(async () => {
    foodService.searchFoods.mockReset().mockReturnValue(of([apple]));
    TestBed.configureTestingModule({ providers: [{ provide: FoodService, useValue: foodService }] });
    fixture = TestBed.createComponent(FoodSearchComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('does not search for an empty query', () => {
    expect(foodService.searchFoods).not.toHaveBeenCalled();
    expect(component.filteredFoods()).toEqual([]);
  });

  it('searches with the trimmed query', async () => {
    component.searchModel.set({ query: '  apple ' });
    await fixture.whenStable();
    expect(foodService.searchFoods).toHaveBeenCalledWith('apple');
    expect(component.filteredFoods()).toEqual([apple]);
  });

  it('falls back to no results when the search fails', async () => {
    foodService.searchFoods.mockReturnValue(throwError(() => new Error('offline')));
    component.searchModel.set({ query: 'apple' });
    await fixture.whenStable();
    expect(component.filteredFoods()).toEqual([]);
  });

  it('emits a copy of the selected food with the default quantity and clears the query', () => {
    const selected: FoodItem[] = [];
    component.foodSelected.subscribe((food) => selected.push(food));
    const food = { ...apple, quantity: 30 };

    component.selectFood(food);

    expect(selected).toEqual([{ ...apple, quantity: 100 }]);
    expect(selected[0]).not.toBe(food);
    expect(food.quantity).toBe(30);
    expect(component.searchModel().query).toBe('');
  });

  it('displays the description of a selected food', () => {
    expect(component.displayFn(apple)).toBe('Apple, raw');
    expect(component.displayFn(null)).toBe('');
    expect(component.displayFn('typed')).toBe('typed');
  });
});
