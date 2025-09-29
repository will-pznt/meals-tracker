import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FoodItem } from '../../data-models/FoodItem';
import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import { FoodService } from '../../service/food.service';
import { MealService } from '../../service/meal.service';
import { FoodSearchComponent } from '../food-search/food-search.component';
import { MealDetailsComponent } from '../meal-details/meal-details.component';
import { NutrientsComponent } from '../nutrients/nutrients.component';

@Component({
  selector: 'app-meal-display',
  standalone: true,
  templateUrl: './meal-display.component.html',
  styleUrl: './meal-display.component.scss',
  imports: [FoodSearchComponent, MatCardModule, NutrientsComponent, MealDetailsComponent],
})
export class MealDisplayComponent {
  private foodService = inject(FoodService);
  private mealService = inject(MealService);
  private snackBar = inject(MatSnackBar);

  @Input() selectedMeal: 'breakfast' | 'lunch' | 'dinner' = 'breakfast';
  @Input() selectedDate!: Date;
  @Input() mealFoodItems!: Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]>;
  @Input() sumEssentialNutrients: FoodNutrientParsed[] = [];

  @Output() addingFoodToMeal = new EventEmitter<FoodItem>();
  @Output() updatingQuantityFood = new EventEmitter<FoodItem>();

  constructor() {}

  get foodItems(): FoodItem[] {
    return this.mealFoodItems[this.selectedMeal] || [];
  }

  addFood(food: FoodItem): void {
    this.addingFoodToMeal.emit(food);
  }

  updateQuantity(updatedItems: FoodItem): void {
    this.updatingQuantityFood.emit(updatedItems);
  }

  onDeleteFoodItem(foodItem: FoodItem): void {
    if (!foodItem.mealId) {
      this.snackBar.open('❌ Missing mealId for deletion', 'Close', { duration: 3000 });
      return;
    }
    this.mealService.deleteFoodItemMeal(foodItem.mealId, foodItem.fdcId).subscribe({
      next: () => {
        this.mealFoodItems[this.selectedMeal] = this.foodItems.filter((item) => item.fdcId !== foodItem.fdcId);
        this.sumEssentialNutrients = this.foodService.sumEssentialNutrients(this.foodItems);
      },
      error: () => {
        this.snackBar.open('❌ Failed to delete item', 'Close', { duration: 3000 });
      },
    });
  }
}
