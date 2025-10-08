import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { FoodItem } from '../../data-models/FoodItem';
import { debounceTime, Subject } from 'rxjs';
import { MinMaxDirective } from './min-max.directive';

@Component({
  selector: 'app-meal-details',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MinMaxDirective,
  ],
  templateUrl: './meal-details.component.html',
  styleUrls: ['./meal-details.component.scss'],
})
export class MealDetailsComponent {
  @Input() foodItems: FoodItem[] = [];
  @Output() quantityFoodItemEvent = new EventEmitter<FoodItem>();
  @Output() deleteFoodItemEvent = new EventEmitter<FoodItem>();

  private quantityChangeSubject = new Subject<FoodItem>();
  private lastEmittedQuantities = new Map<number, number>();

  columnsToDisplay = ['description', 'quantity', 'actions'];

  constructor() {
    this.quantityChangeSubject.pipe(debounceTime(500)).subscribe((foodItem) => this.emitIfChanged(foodItem));
  }

  /**
   * Update quantity of a food item and emit event after debounce time
   * @param foodItem
   */
  onQuantityChange(foodItem: FoodItem): void {
    this.quantityChangeSubject.next(foodItem);
  }

  /**
   * Emit event if quantity has changed on input blur
   * @param foodItem
   */
  onQuantityBlur(foodItem: FoodItem): void {
    this.emitIfChanged(foodItem);
  }

  /**
   * Emit event if quantity has changed
   * @param foodItem
   */
  private emitIfChanged(foodItem: FoodItem): void {
    if (typeof foodItem.fdcId === 'number') {
      const lastValue = this.lastEmittedQuantities.get(foodItem.fdcId);
      if (lastValue !== foodItem.quantity && foodItem.quantity !== undefined) {
        this.lastEmittedQuantities.set(foodItem.fdcId, foodItem.quantity);
        this.quantityFoodItemEvent.emit(foodItem);
      }
    }
  }

  /**
   * Emit event to delete a food item
   * @param foodItem
   */
  deleteFoodItem(foodItem: FoodItem): void {
    this.deleteFoodItemEvent.emit(foodItem);
  }

  trackByFdcId(_: number, item: FoodItem): number {
    return item.fdcId;
  }
}
