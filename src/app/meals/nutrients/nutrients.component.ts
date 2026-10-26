import { Component, computed, inject, input } from '@angular/core';

import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import { NUTRIENT_ICONS } from '../../data-models/NUTRIENT_ICONS';
import { dailyTarget } from '../../nutrition/nutrient-totals';
import { GenderService } from '../../service/gender.service';

export interface NutrientRow {
  nutrientName: string;
  label: string;
  unitName: string;
  icon: string;
  value: number;
  target: number;
  percent: number;
  over: boolean;
  low: boolean;
  isLimit: boolean;
}

@Component({
  selector: 'app-nutrients',
  templateUrl: './nutrients.component.html',
  styleUrl: './nutrients.component.scss',
})
export class NutrientsComponent {
  private genderService = inject(GenderService);

  readonly nutrients = input<FoodNutrientParsed[]>([]);

  readonly rows = computed<NutrientRow[]>(() => {
    const gender = this.genderService.gender();
    return this.nutrients().map((nutrient) => {
      const target = dailyTarget(nutrient, gender);
      const percent = target ? Math.min(100, Math.round((nutrient.value / target) * 100)) : 0;
      return {
        nutrientName: nutrient.nutrientName,
        label: nutrient.label,
        unitName: nutrient.unitName,
        icon: NUTRIENT_ICONS[nutrient.nutrientName] ?? '❓',
        value: nutrient.value,
        target,
        percent,
        over: target > 0 && nutrient.value > target,
        low: !nutrient.isLimit && percent < 50,
        isLimit: !!nutrient.isLimit,
      };
    });
  });
}
