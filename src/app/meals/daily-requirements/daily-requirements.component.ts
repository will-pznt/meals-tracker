import { Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import nutrientFoodsData from '../../data-models/nutrient-foods.json';
import { NutrientRecommendation } from '../../data-models/NutrientRecommendation';
import { dailyTarget, sumEssentialNutrients } from '../../nutrition/nutrient-totals';
import { GenderService } from '../../service/gender.service';
import { DayMeals, EMPTY_DAY } from '../../service/meal.service';
import { NutrientsComponent } from '../nutrients/nutrients.component';

export const LOW_INTAKE_THRESHOLD = 0.7;
export const MAX_SUGGESTED_FOODS = 5;

export function buildRecommendations(
  nutrients: readonly FoodNutrientParsed[],
  gender: 'men' | 'women',
  foods: readonly { nutrientName: string; foodName: string }[] = nutrientFoodsData,
): NutrientRecommendation[] {
  return nutrients
    .map((nutrient) => ({ nutrient, target: dailyTarget(nutrient, gender) }))
    .filter(({ nutrient, target }) => !nutrient.isLimit && target > 0 && nutrient.value < LOW_INTAKE_THRESHOLD * target)
    .sort((a, b) => a.nutrient.value / a.target - b.nutrient.value / b.target)
    .map(({ nutrient }) => ({
      nutrient,
      foods: foods
        .filter((f) => f.nutrientName === nutrient.nutrientName)
        .map((f) => f.foodName)
        .slice(0, MAX_SUGGESTED_FOODS),
    }));
}

@Component({
  selector: 'app-daily-requirements',
  imports: [MatCardModule, NutrientsComponent],
  templateUrl: './daily-requirements.component.html',
  styleUrl: './daily-requirements.component.scss',
})
export class DailyRequirementsComponent {
  private genderService = inject(GenderService);

  readonly mealFoodItems = input<DayMeals>(EMPTY_DAY);

  readonly dailyNutrients = computed<FoodNutrientParsed[]>(() => {
    const { breakfast, lunch, dinner } = this.mealFoodItems();
    return sumEssentialNutrients([...breakfast, ...lunch, ...dinner]);
  });

  readonly lowNutrientsRecommendations = computed(() =>
    buildRecommendations(this.dailyNutrients(), this.genderService.gender()),
  );
}
