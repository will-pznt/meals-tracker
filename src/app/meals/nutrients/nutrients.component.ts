import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Subscription } from 'rxjs';

import { FoodNutrientParsed } from '../../data-models/FoodNutrientParsed';
import { NUTRIENT_ICONS } from '../../data-models/NUTRIENT_ICONS';
import { GenderService } from '../../service/gender.service';

@Component({
  selector: 'app-nutrients',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './nutrients.component.html',
  styleUrl: './nutrients.component.scss',
})
export class NutrientsComponent implements OnChanges, OnDestroy {
  private genderService = inject(GenderService);

  @Input() nutrients: FoodNutrientParsed[] | undefined;

  nutrientIcons = NUTRIENT_ICONS;
  gender: string | undefined;
  private sub?: Subscription;

  constructor() {
    this.sub = this.genderService.genderChanges.subscribe((g) => {
      this.gender = g;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getDailyValue(nutrient: FoodNutrientParsed): number {
    return this.gender === 'men' ? (nutrient.dailyValueMen ?? 0) : (nutrient.dailyValueWomen ?? 0);
  }

  getPercent(nutrient: FoodNutrientParsed): number {
    const daily = this.getDailyValue(nutrient);
    if (!daily || daily === 0) return 0;
    const val = nutrient.value || 0;
    return Math.min(100, Math.round((val / daily) * 100));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gender'] && changes['gender'].currentValue) {
      this.genderService.setGender(changes['gender'].currentValue);
    }
  }
}
