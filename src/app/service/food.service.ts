import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ESSENTIAL_NUTRIENTS_DATA } from '../data-models/ESSENTIAL_NUTRIENTS_DATA';
import { FoodItem } from '../data-models/FoodItem';
import { FoodNutrientParsed } from '../data-models/FoodNutrientParsed';

@Injectable({
  providedIn: 'root',
})
export class FoodService {
  private http = inject(HttpClient);

  private BASE = '/api/foods';

  constructor() {}

  searchFoods(query: string): Observable<FoodItem[]> {
    return this.http.get<any>(`${this.BASE}/search`, { params: { q: query } }).pipe(
      map((res) =>
        res.foods.map((food: any) => ({
          ...food,
          quantity: 100,
        })),
      ),
    );
  }

  getFoodDetails(fdcId: number): Observable<any> {
    return this.http.get<any>(`${this.BASE}/${fdcId}`);
  }
  sumEssentialNutrients(foodItems: FoodItem[]): FoodNutrientParsed[] {
    const summedNutrients = ESSENTIAL_NUTRIENTS_DATA.map((nutrient) => ({
      ...nutrient,
      value: 0,
    }));

    for (const item of foodItems) {
      const quantity = item.quantity ?? 100;

      for (const nutrient of item.foodNutrients || []) {
        const match = summedNutrients.find(
          (en) =>
            en.nutrientName === nutrient.nutrientName && en.unitName.toLowerCase() === nutrient.unitName.toLowerCase(),
        );
        if (!match) continue;
        const scaledValue = ((nutrient.value || 0) * quantity) / 100;
        match.value += scaledValue;
      }
    }

    // Round each nutrient's value once at the end
    for (const nutrient of summedNutrients) {
      nutrient.value = parseFloat(nutrient.value.toFixed(2));
    }

    return summedNutrients;
  }
}
