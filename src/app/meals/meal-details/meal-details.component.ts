import { Component, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { debounce, filter, groupBy, merge, mergeMap, Subject, timer } from 'rxjs';

import { MinMaxDirective } from './min-max.directive';
import { FoodItem } from '../../data-models/FoodItem';

export const QUANTITY_DEBOUNCE_MS = 500;
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 9999;

interface QuantityChange {
  fdcId: number;
  quantity: number;
}

@Component({
  selector: 'app-meal-details',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MinMaxDirective],
  templateUrl: './meal-details.component.html',
  styleUrls: ['./meal-details.component.scss'],
})
export class MealDetailsComponent {
  readonly foodItems = input<FoodItem[]>([]);
  readonly quantityFoodItemEvent = output<FoodItem>();
  readonly deleteFoodItemEvent = output<FoodItem>();

  protected readonly minQuantity = MIN_QUANTITY;
  protected readonly maxQuantity = MAX_QUANTITY;
  protected readonly columnsToDisplay = ['description', 'quantity', 'actions'];

  private readonly quantityChanges = new Subject<QuantityChange>();
  private readonly flushes = new Subject<number>();

  constructor() {
    this.quantityChanges
      .pipe(
        groupBy((change) => change.fdcId),
        mergeMap((changes) =>
          changes.pipe(
            debounce(() =>
              merge(timer(QUANTITY_DEBOUNCE_MS), this.flushes.pipe(filter((fdcId) => fdcId === changes.key))),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((change) => this.commit(change));
  }

  onQuantityInput(foodItem: FoodItem, quantity: number): void {
    this.quantityChanges.next({ fdcId: foodItem.fdcId, quantity });
  }

  onQuantityBlur(foodItem: FoodItem, event: FocusEvent): void {
    this.flushes.next(foodItem.fdcId);
    const inputEl = event.target as HTMLInputElement;
    if (Number.isNaN(Number.parseInt(inputEl.value, 10))) {
      inputEl.value = String(this.findItem(foodItem.fdcId)?.quantity ?? foodItem.quantity ?? '');
    }
  }

  deleteFoodItem(foodItem: FoodItem): void {
    this.deleteFoodItemEvent.emit(foodItem);
  }

  trackByFdcId(_: number, item: FoodItem): number {
    return item.fdcId;
  }

  private commit({ fdcId, quantity }: QuantityChange): void {
    const current = this.findItem(fdcId);
    if (!current || current.quantity === quantity) return;
    this.quantityFoodItemEvent.emit({ ...current, quantity });
  }

  private findItem(fdcId: number): FoodItem | undefined {
    return this.foodItems().find((item) => item.fdcId === fdcId);
  }
}
