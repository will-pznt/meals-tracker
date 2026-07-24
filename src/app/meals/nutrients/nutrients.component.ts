import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import { NUTRIENT_ICONS } from '../../data-models/NUTRIENT_ICONS';
import { GenderService } from '../../service/gender.service';

@Component({
  selector: 'app-nutrients',
  imports: [CommonModule, MatCardModule],
  templateUrl: './nutrients.component.html',
  styleUrl: './nutrients.component.scss',
})
export class NutrientsComponent {
  private genderService = inject(GenderService);

  readonly nutrients = input<FoodNutrientParsed[]>();

  nutrientIcons = NUTRIENT_ICONS;

  /**
   * Get daily value
   * @param nutrient
   * @returns
   */
  getDailyValue(nutrient: FoodNutrientParsed): number {
    return this.genderService.gender() === 'men' ? (nutrient.dailyValueMen ?? 0) : (nutrient.dailyValueWomen ?? 0);
  }

  /**
   * Get percent of daily value
   * @param nutrient
   * @returns
   */
  getPercent(nutrient: FoodNutrientParsed): number {
    const daily = this.getDailyValue(nutrient);
    if (!daily || daily === 0) return 0;
    const val = nutrient.value || 0;
    return Math.min(100, Math.round((val / daily) * 100));
  }
}
