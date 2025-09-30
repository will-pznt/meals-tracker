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

  /** Searches for foods using the provided query string.
   * Each returned food item is assigned a default quantity of 100 grams.
   * @param query The search query string.
   * @returns An Observable emitting an array of FoodItem objects.
   */
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

  /** Fetches detailed information for a specific food item by its FDC ID.
   * @param fdcId The FDC ID of the food item.
   * @returns An Observable emitting the detailed food item data.
   */
  getFoodDetails(fdcId: number): Observable<any> {
    return this.http.get<any>(`${this.BASE}/${fdcId}`);
  }

  /** Sums the essential nutrients across a list of food items, scaling each nutrient by the food item's quantity.
   * If a food item does not specify a quantity, it defaults to 100 grams.
   * @param foodItems An array of FoodItem objects to sum nutrients from.
   * @returns An array of FoodNutrientParsed objects representing the summed essential nutrients.
   */
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
