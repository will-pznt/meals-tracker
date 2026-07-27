import { Component, inject, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FoodItem } from '../../data-models/FoodItem';
import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import { MealService } from '../../service/meal.service';
import { FoodSearchComponent } from '../food-search/food-search.component';
import { MealDetailsComponent } from '../meal-details/meal-details.component';
import { NutrientsComponent } from '../nutrients/nutrients.component';

@Component({
  selector: 'app-meal-display',
  templateUrl: './meal-display.component.html',
  styleUrl: './meal-display.component.scss',
  imports: [FoodSearchComponent, MatCardModule, NutrientsComponent, MealDetailsComponent],
})
export class MealDisplayComponent {
  private mealService = inject(MealService);
  private snackBar = inject(MatSnackBar);

  readonly selectedMeal = input<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  readonly selectedDate = input.required<Date>();
  readonly mealFoodItems = input.required<Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]>>();

  readonly sumEssentialNutrients = input<FoodNutrientParsed[]>([]);

  readonly addingFoodToMeal = output<FoodItem>();
  readonly updatingQuantityFood = output<FoodItem>();
  readonly deletingFoodFromMeal = output<FoodItem>();

  constructor() {}

  get foodItems(): FoodItem[] {
    return this.mealFoodItems()[this.selectedMeal()] || [];
  }

  /**
   * Emit event to add food to the selected meal
   * @param food
   */
  addFood(food: FoodItem): void {
    this.addingFoodToMeal.emit(food);
  }

  /**
   * Emit event to update quantity of a food item
   * @param updatedItems
   */
  updateQuantity(updatedItems: FoodItem): void {
    this.updatingQuantityFood.emit(updatedItems);
  }

  /**
   * Delete a food item from the meal. The actual mealFoodItems state is owned by the
   * parent (a signal), which is updated via deletingFoodFromMeal once the delete succeeds —
   * this component doesn't mutate it directly.
   * @param foodItem
   * @returns
   */
  onDeleteFoodItem(foodItem: FoodItem): void {
    if (!foodItem.mealId) {
      this.snackBar.open('❌ Missing mealId for deletion', 'Close', { duration: 3000 });
      return;
    }
    this.mealService.deleteFoodItemMeal(foodItem.mealId, foodItem.fdcId).subscribe({
      next: () => {
        this.deletingFoodFromMeal.emit(foodItem);
      },
      error: () => {
        this.snackBar.open('❌ Failed to delete item', 'Close', { duration: 3000 });
      },
    });
  }
}
