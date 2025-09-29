import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Subscription } from 'rxjs';

import { FoodItem } from '../../data-models/FoodItem';
import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import nutrientFoodsData from '../../data-models/nutrient-foods.json';
import { NutrientRecommendation } from '../../data-models/NutrientRecommendation';
import { FoodService } from '../../service/food.service';
import { GenderService } from '../../service/gender.service';
import { NutrientsComponent } from '../nutrients/nutrients.component';

@Component({
  selector: 'app-daily-requirements',
  standalone: true,
  imports: [MatCardModule, NutrientsComponent, CommonModule],
  templateUrl: './daily-requirements.component.html',
  styleUrl: './daily-requirements.component.scss',
})
export class DailyRequirementsComponent implements OnChanges, OnDestroy {
  private foodService = inject(FoodService);
  private genderService = inject(GenderService);

  @Input() mealFoodItems: Record<'breakfast' | 'lunch' | 'dinner', FoodItem[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
  };

  gender: 'men' | 'women' | undefined;

  dailyNutrients: FoodNutrientParsed[] = [];
  lowNutrientsRecommendations: NutrientRecommendation[] = [];

  private sub?: Subscription;

  constructor() {
    this.genderService.genderChanges.subscribe((g) => (this.gender = g));
  }

  ngOnChanges(): void {
    this.updateDailyNutrients();
    this.updateLowNutrientsRecommendations();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateDailyNutrients(): void {
    const allItems: FoodItem[] = [
      ...this.mealFoodItems.breakfast,
      ...this.mealFoodItems.lunch,
      ...this.mealFoodItems.dinner,
    ];

    this.dailyNutrients = this.foodService.sumEssentialNutrients(allItems);
  }

  private updateLowNutrientsRecommendations(): void {
    this.lowNutrientsRecommendations = [];

    for (const nutrient of this.dailyNutrients) {
      const dailyTarget = this.gender === 'men' ? (nutrient.dailyValueMen ?? 0) : (nutrient.dailyValueWomen ?? 0);
      if (!dailyTarget) continue;

      // only show if < 70% of daily target
      if (nutrient.value < 0.7 * dailyTarget) {
        const topFoods = nutrientFoodsData
          .filter((f) => f.nutrientName === nutrient.nutrientName)
          .map((f) => f.foodName)
          .slice(0, 5);

        this.lowNutrientsRecommendations.push({
          nutrient,
          foods: topFoods,
        });
      }
    }

    // sort by % of daily target ascending (most lacking first)
    this.lowNutrientsRecommendations.sort((a, b) => {
      const aPercent =
        (a.nutrient.value / (this.gender === 'men' ? a.nutrient.dailyValueMen! : a.nutrient.dailyValueWomen!)) * 100;
      const bPercent =
        (b.nutrient.value / (this.gender === 'men' ? b.nutrient.dailyValueMen! : b.nutrient.dailyValueWomen!)) * 100;
      return aPercent - bPercent;
    });
  }
}
