import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from './auth-service.service';
import { DemoService } from './demo.service';
import { FoodService } from './food.service';
import { EMPTY_DAY, groupStoredMeals, isMealName, mealKey, MealService, toFoodNutrients } from './meal.service';
import { DEMO_MEAL_DATA } from '../data-models/DEMO_MEAL_DATA';
import { FIREBASE_DB } from '../firebase';

describe('meal helpers', () => {
  it('builds a deterministic key per date and meal', () => {
    expect(mealKey('2026-10-23', 'lunch')).toBe('2026-10-23_lunch');
  });

  it('recognises valid meal names only', () => {
    expect(isMealName('dinner')).toBe(true);
    expect(isMealName('daily')).toBe(false);
    expect(isMealName(undefined)).toBe(false);
  });

  it('flattens USDA detail nutrients into the search shape', () => {
    const result = toFoodNutrients([
      { id: 9, amount: 12.5, nutrient: { id: 1003, name: 'Protein', number: '203', rank: 600, unitName: 'g' } },
      { id: 10, nutrient: { id: 1008, name: 'Energy', number: '208', rank: 300, unitName: 'kcal' } },
    ]);
    expect(result).toEqual([
      expect.objectContaining({ nutrientName: 'Protein', nutrientNumber: '203', unitName: 'g', value: 12.5 }),
      expect.objectContaining({ nutrientName: 'Energy', nutrientNumber: '208', value: 0 }),
    ]);
  });

  it('returns an empty list for missing nutrients', () => {
    expect(toFoodNutrients(undefined)).toEqual([]);
  });

  describe('groupStoredMeals', () => {
    it('groups records by meal name with no legacy keys for deterministic ids', () => {
      const { items, legacyKeys } = groupStoredMeals('2026-10-23', {
        '2026-10-23_breakfast': { name: 'breakfast', items: [{ fdcId: 1, quantity: 50 }] },
        '2026-10-23_dinner': { name: 'dinner', items: [{ fdcId: 2, quantity: 80 }] },
      });
      expect(items.breakfast).toEqual([{ fdcId: 1, quantity: 50 }]);
      expect(items.lunch).toEqual([]);
      expect(items.dinner).toEqual([{ fdcId: 2, quantity: 80 }]);
      expect(legacyKeys).toEqual([]);
    });

    it('merges duplicate legacy records for the same meal and reports their keys', () => {
      const { items, legacyKeys } = groupStoredMeals('2026-10-23', {
        '-Nabc': { name: 'lunch', items: [{ fdcId: 1, quantity: 50 }] },
        '-Nxyz': {
          name: 'lunch',
          items: [
            { fdcId: 1, quantity: 70 },
            { fdcId: 3, quantity: 20 },
          ],
        },
      });
      expect(items.lunch).toEqual([
        { fdcId: 1, quantity: 50 },
        { fdcId: 3, quantity: 20 },
      ]);
      expect(legacyKeys).toEqual(['-Nabc', '-Nxyz']);
    });

    it('defaults missing quantities and skips unknown meal names', () => {
      const { items } = groupStoredMeals('2026-10-23', {
        a: { name: 'breakfast', items: [{ fdcId: 1 } as never] },
        b: { name: 'snack' as never, items: [{ fdcId: 2, quantity: 1 }] },
      });
      expect(items.breakfast).toEqual([{ fdcId: 1, quantity: 100 }]);
      expect([...items.lunch, ...items.dinner]).toEqual([]);
    });
  });
});

describe('MealService', () => {
  let demo: DemoService;
  const auth = { currentUserId: null as string | null };
  const foodService = { getFoodDetails: vi.fn() };

  beforeEach(() => {
    sessionStorage.clear();
    auth.currentUserId = null;
    TestBed.configureTestingModule({
      providers: [
        { provide: FIREBASE_DB, useValue: {} },
        { provide: AuthService, useValue: auth },
        { provide: FoodService, useValue: foodService },
      ],
    });
    demo = TestBed.inject(DemoService);
  });

  it('serves demo meals without touching Firebase in demo mode', async () => {
    demo.enable();
    const service = TestBed.inject(MealService);
    await expect(firstValueFrom(service.getMealsByDate('2026-01-01'))).resolves.toBe(DEMO_MEAL_DATA);
    await expect(firstValueFrom(service.saveMeal('2026-01-01', 'lunch', []))).resolves.toBeUndefined();
    expect(foodService.getFoodDetails).not.toHaveBeenCalled();
  });

  it('returns an empty day when nobody is signed in', async () => {
    const service = TestBed.inject(MealService);
    await expect(firstValueFrom(service.getMealsByDate('2026-01-01'))).resolves.toEqual(EMPTY_DAY);
  });

  it('refuses to save when nobody is signed in', async () => {
    const service = TestBed.inject(MealService);
    await expect(firstValueFrom(service.saveMeal('2026-01-01', 'lunch', [{ fdcId: 1, quantity: 1 }]))).rejects.toThrow(
      'User not authenticated',
    );
  });
});
