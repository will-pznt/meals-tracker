import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { FoodItem } from '../../data-models/FoodItem';
import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import { MealName } from '../../data-models/Meal';
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
  readonly selectedMeal = input<MealName>('breakfast');
  readonly foodItems = input<FoodItem[]>([]);
  readonly nutrients = input<FoodNutrientParsed[]>([]);

  readonly addingFoodToMeal = output<FoodItem>();
  readonly updatingQuantityFood = output<FoodItem>();
  readonly deletingFoodFromMeal = output<FoodItem>();
}
