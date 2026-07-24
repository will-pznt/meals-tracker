import { Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { FoodItem } from '../../data-models/FoodItem';
import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import nutrientFoodsData from '../../data-models/nutrient-foods.json';
import { NutrientRecommendation } from '../../data-models/NutrientRecommendation';
import { FoodService } from '../../service/food.service';
import { GenderService } from '../../service/gender.service';
import { NutrientsComponent } from '../nutrients/nutrients.component';

@Component({
  selector: 'app-daily-requirements',
  imports: [MatCardModule, NutrientsComponent],
  templateUrl: './daily-requirements.component.html',
  styleUrl: './daily-requirements.component.scss',
})
export class DailyRequirementsComponent {
  private foodService = inject(FoodService);
  private genderService = inject(GenderService);

  readonly mealFoodItems = input<Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
  });

  /** Recomputes whenever the meal contents change. */
  readonly dailyNutrients = computed<FoodNutrientParsed[]>(() => {
    const items = this.mealFoodItems();
    const allItems: FoodItem[] = [...items.breakfast, ...items.lunch, ...items.dinner];
    return this.foodService.sumEssentialNutrients(allItems);
  });

  /** Recomputes whenever the daily nutrients or the target gender profile change. */
  readonly lowNutrientsRecommendations = computed<NutrientRecommendation[]>(() => {
    const gender = this.genderService.gender();
    const targetFor = (n: FoodNutrientParsed) => (gender === 'men' ? (n.dailyValueMen ?? 0) : (n.dailyValueWomen ?? 0));

    const recommendations: NutrientRecommendation[] = [];
    for (const nutrient of this.dailyNutrients()) {
      const dailyTarget = targetFor(nutrient);
      if (!dailyTarget) continue;

      // only show if < 70% of daily target
      if (nutrient.value < 0.7 * dailyTarget) {
        const topFoods = nutrientFoodsData
          .filter((f) => f.nutrientName === nutrient.nutrientName)
          .map((f) => f.foodName)
          .slice(0, 5);

        recommendations.push({ nutrient, foods: topFoods });
      }
    }

    // sort by % of daily target ascending (most lacking first)
    recommendations.sort((a, b) => {
      const aPercent = (a.nutrient.value / targetFor(a.nutrient)) * 100;
      const bPercent = (b.nutrient.value / targetFor(b.nutrient)) * 100;
      return aPercent - bPercent;
    });

    return recommendations;
  });
}
