import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { FoodItem } from '../../data-models/FoodItem';

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
  ],
  templateUrl: './meal-details.component.html',
  styleUrls: ['./meal-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealDetailsComponent {
  @Input() foodItems: FoodItem[] = [];
  @Output() quantityFoodItemEvent = new EventEmitter<FoodItem>();
  @Output() deleteFoodItemEvent = new EventEmitter<FoodItem>();

  columnsToDisplay = ['description', 'quantity', 'actions'];

  updateQuantity(foodItem: FoodItem, newQuantity: number): void {
    foodItem.quantity = newQuantity;
    this.quantityFoodItemEvent.emit(foodItem);
  }

  limitToFiveDigits(event: Event, foodItem: FoodItem): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 4) {
      input.value = input.value.slice(0, 4);
    }

    const numericValue = Number(input.value);
    if (!isNaN(numericValue)) {
      this.updateQuantity(foodItem, numericValue);
    }
  }
  deleteFoodItem(foodItem: FoodItem): void {
    this.deleteFoodItemEvent.emit(foodItem);
  }
}
