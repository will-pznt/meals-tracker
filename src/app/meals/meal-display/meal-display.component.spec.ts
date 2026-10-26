import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { MealDisplayComponent } from './meal-display.component';
import { FoodItem } from '../../data-models/FoodItem';
import { FoodService } from '../../service/food.service';

describe('MealDisplayComponent', () => {
  let fixture: ComponentFixture<MealDisplayComponent>;
  const milk: FoodItem = { fdcId: 2, description: 'Milk', quantity: 200 };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [{ provide: FoodService, useValue: { searchFoods: vi.fn() } }] });
    fixture = TestBed.createComponent(MealDisplayComponent);
    fixture.componentRef.setInput('selectedMeal', 'dinner');
    fixture.componentRef.setInput('foodItems', [milk]);
    await fixture.whenStable();
  });

  it('shows the meal name and its foods', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.meal-title')?.textContent).toContain('dinner');
    expect(el.textContent).toContain('Milk');
  });

  it('forwards delete requests to the parent', () => {
    const deleted: FoodItem[] = [];
    fixture.componentInstance.deletingFoodFromMeal.subscribe((f) => deleted.push(f));
    (fixture.nativeElement.querySelector('button[aria-label="Remove Milk"]') as HTMLButtonElement).click();
    expect(deleted).toEqual([milk]);
  });
});
