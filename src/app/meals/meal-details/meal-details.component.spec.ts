import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { MealDetailsComponent, QUANTITY_DEBOUNCE_MS } from './meal-details.component';
import { clampQuantity } from './min-max.directive';
import { FoodItem } from '../../data-models/FoodItem';

describe('clampQuantity', () => {
  it.each([
    ['50', 50],
    ['0', 1],
    ['-4', 1],
    ['12000', 9999],
    ['12.7', 12],
  ])('clamps %s to %s', (raw, expected) => {
    expect(clampQuantity(raw, 1, 9999)).toBe(expected);
  });

  it('returns null for non-numeric input', () => {
    expect(clampQuantity('', 1, 9999)).toBeNull();
  });
});

describe('MealDetailsComponent', () => {
  let fixture: ComponentFixture<MealDetailsComponent>;
  let emitted: FoodItem[];
  const items: FoodItem[] = [
    { fdcId: 1, description: 'Oats', quantity: 100 },
    { fdcId: 2, description: 'Milk', quantity: 200 },
  ];

  function inputs(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input'));
  }

  function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(MealDetailsComponent);
    fixture.componentRef.setInput('foodItems', items);
    emitted = [];
    fixture.componentInstance.quantityFoodItemEvent.subscribe((item) => emitted.push(item));
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('shows an empty state without items', () => {
    fixture.componentRef.setInput('foodItems', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Your meal is empty');
  });

  it('renders one quantity input per food with its current value', () => {
    expect(inputs().map((i) => i.value)).toEqual(['100', '200']);
  });

  it('debounces typing and emits a new object without mutating the input', () => {
    type(inputs()[0], '1');
    type(inputs()[0], '15');
    type(inputs()[0], '150');
    expect(emitted).toEqual([]);

    vi.advanceTimersByTime(QUANTITY_DEBOUNCE_MS);

    expect(emitted).toEqual([{ fdcId: 1, description: 'Oats', quantity: 150 }]);
    expect(emitted[0]).not.toBe(items[0]);
    expect(items[0].quantity).toBe(100);
  });

  it('debounces each food independently', () => {
    type(inputs()[0], '120');
    type(inputs()[1], '80');
    vi.advanceTimersByTime(QUANTITY_DEBOUNCE_MS);
    expect(emitted.map((e) => [e.fdcId, e.quantity])).toEqual([
      [1, 120],
      [2, 80],
    ]);
  });

  it('flushes the pending change immediately on blur', () => {
    type(inputs()[1], '250');
    inputs()[1].dispatchEvent(new FocusEvent('blur'));
    expect(emitted.map((e) => e.quantity)).toEqual([250]);

    vi.advanceTimersByTime(QUANTITY_DEBOUNCE_MS);
    expect(emitted).toHaveLength(1);
  });

  it('clamps out-of-range values in the input', () => {
    type(inputs()[0], '50000');
    expect(inputs()[0].value).toBe('9999');
    vi.advanceTimersByTime(QUANTITY_DEBOUNCE_MS);
    expect(emitted[0].quantity).toBe(9999);
  });

  it('does not emit when the value ends up unchanged', () => {
    type(inputs()[0], '101');
    type(inputs()[0], '100');
    vi.advanceTimersByTime(QUANTITY_DEBOUNCE_MS);
    expect(emitted).toEqual([]);
  });

  it('restores the current quantity when the input is left empty', () => {
    type(inputs()[0], '');
    inputs()[0].dispatchEvent(new FocusEvent('blur'));
    expect(inputs()[0].value).toBe('100');
    expect(emitted).toEqual([]);
  });

  it('emits the food to delete', () => {
    const deleted: FoodItem[] = [];
    fixture.componentInstance.deleteFoodItemEvent.subscribe((item) => deleted.push(item));
    (fixture.nativeElement.querySelector('button[aria-label="Remove Milk"]') as HTMLButtonElement).click();
    expect(deleted).toEqual([items[1]]);
  });
});
