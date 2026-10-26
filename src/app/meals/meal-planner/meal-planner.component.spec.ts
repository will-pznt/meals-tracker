import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { formatDateLocal, MealPlannerComponent } from './meal-planner.component';
import { FoodItem } from '../../data-models/FoodItem';
import { DayMeals, MealService } from '../../service/meal.service';

describe('formatDateLocal', () => {
  it('formats a date as YYYY-MM-DD in local time', () => {
    expect(formatDateLocal(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('MealPlannerComponent', () => {
  let fixture: ComponentFixture<MealPlannerComponent>;
  let component: MealPlannerComponent;
  let day: DayMeals;
  const snackBar = { open: vi.fn() };
  const mealService = {
    getMealsByDate: vi.fn<(date: string) => Observable<DayMeals>>(),
    saveMeal: vi.fn<(date: string, name: string, items: unknown[]) => Observable<void>>(),
  };

  const oats: FoodItem = { fdcId: 1, description: 'Oats', quantity: 80, foodNutrients: [] };
  const milk: FoodItem = { fdcId: 2, description: 'Milk', quantity: 200, foodNutrients: [] };

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(MealPlannerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  beforeEach(async () => {
    day = { breakfast: [oats], lunch: [], dinner: [] };
    snackBar.open.mockReset();
    mealService.getMealsByDate.mockReset().mockImplementation(() => of(day));
    mealService.saveMeal.mockReset().mockReturnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        { provide: MealService, useValue: mealService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    await create();
  });

  it("loads today's meals", () => {
    expect(mealService.getMealsByDate).toHaveBeenCalledWith(formatDateLocal(new Date()));
    expect(component.loading()).toBe(false);
    expect(component.currentItems()).toEqual([oats]);
  });

  it('reloads meals when the date changes', async () => {
    component.onDateChange(new Date(2026, 4, 17));
    await fixture.whenStable();
    expect(mealService.getMealsByDate).toHaveBeenLastCalledWith('2026-05-17');
  });

  it('adds a food and saves the whole meal under its date', () => {
    component.onFoodAdded({ ...milk, quantity: undefined });

    expect(component.currentItems().map((f) => f.fdcId)).toEqual([1, 2]);
    expect(mealService.saveMeal).toHaveBeenCalledWith(component.dateKey(), 'breakfast', [
      { fdcId: 1, quantity: 80 },
      { fdcId: 2, quantity: 100 },
    ]);
  });

  it('refuses to add the same food twice', () => {
    component.onFoodAdded(oats);
    expect(snackBar.open).toHaveBeenCalledWith('ℹ️ This food is already in the meal', 'Close', expect.anything());
    expect(mealService.saveMeal).not.toHaveBeenCalled();
  });

  it('updates quantities immutably and saves them', () => {
    const before = component.mealFoodItems();
    component.onQuantityChanged({ ...oats, quantity: 150 });

    expect(component.currentItems()[0].quantity).toBe(150);
    expect(before.breakfast[0].quantity).toBe(80);
    expect(mealService.saveMeal).toHaveBeenCalledWith(component.dateKey(), 'breakfast', [{ fdcId: 1, quantity: 150 }]);
  });

  it('ignores quantity changes for foods that are not in the meal', () => {
    component.onQuantityChanged({ ...milk, quantity: 10 });
    expect(mealService.saveMeal).not.toHaveBeenCalled();
  });

  it('deletes a food and saves the remaining items', () => {
    component.onFoodDeleted(oats);
    expect(component.currentItems()).toEqual([]);
    expect(mealService.saveMeal).toHaveBeenCalledWith(component.dateKey(), 'breakfast', []);
  });

  it('recomputes meal nutrients from the current items', () => {
    component.onFoodAdded({ ...milk, foodNutrients: [{ nutrientNumber: '203', unitName: 'G', value: 3.4 } as never] });
    const protein = component.mealNutrients().find((n) => n.nutrientName === 'Protein');
    expect(protein?.value).toBe(6.8);
  });

  it('does not edit meals from the daily summary tab', () => {
    component.selectMeal('daily');
    component.onFoodAdded(milk);
    component.onFoodDeleted(oats);
    expect(component.currentItems()).toEqual([]);
    expect(mealService.saveMeal).not.toHaveBeenCalled();
  });

  it('writes saves one at a time in order', () => {
    const first = new Subject<void>();
    mealService.saveMeal.mockReturnValueOnce(first).mockReturnValue(of(undefined));

    component.onFoodAdded(milk);
    component.onFoodDeleted(oats);
    expect(mealService.saveMeal).toHaveBeenCalledTimes(1);

    first.complete();
    expect(mealService.saveMeal).toHaveBeenCalledTimes(2);
    expect(mealService.saveMeal.mock.calls[1][2]).toEqual([{ fdcId: 2, quantity: 200 }]);
  });

  it('keeps saving after a failed save', () => {
    mealService.saveMeal.mockReturnValueOnce(throwError(() => new Error('offline')));
    component.onFoodAdded(milk);
    component.onFoodDeleted(milk);

    expect(snackBar.open).toHaveBeenCalledWith('❌ Failed to save meal', 'Close', expect.anything());
    expect(mealService.saveMeal).toHaveBeenCalledTimes(2);
  });

  it('shows an error and an empty day when loading fails', async () => {
    mealService.getMealsByDate.mockReturnValue(throwError(() => new Error('offline')));
    component.onDateChange(new Date(2026, 1, 1));
    await fixture.whenStable();

    expect(component.mealFoodItems()).toEqual({ breakfast: [], lunch: [], dinner: [] });
    expect(snackBar.open).toHaveBeenCalledWith('❌ Failed to load meals', 'Close', expect.anything());
  });

  it('renders a button per meal tab and the daily summary when selected', async () => {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.meal-button'));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Breakfast', 'Lunch', 'Dinner', 'Daily']);

    buttons[3].click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-daily-requirements')).not.toBeNull();
    expect(buttons[3].getAttribute('aria-pressed')).toBe('true');
  });
});
